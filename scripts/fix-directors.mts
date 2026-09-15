import path from "node:path";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const API_KEY = process.env.TMDB_API_KEY;
const BASE = "https://api.themoviedb.org/3";

interface Row {
  id: number;
  title_kr: string;
  tmdb_id: number;
  media_type: "movie" | "tv";
}

interface TmdbCrewMember {
  name: string;
  job?: string;
}
interface TmdbCreator {
  name: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getCrewDirectors(id: number, mediaType: string, lang: string): Promise<string[]> {
  const url = `${BASE}/${mediaType}/${id}/credits?api_key=${API_KEY}&language=${lang}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const crew = (data.crew || []) as TmdbCrewMember[];
  return crew.filter((c) => c.job === "Director").map((c) => c.name);
}

async function getCreatedBy(id: number, lang: string): Promise<string[]> {
  const url = `${BASE}/tv/${id}?api_key=${API_KEY}&language=${lang}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return ((data.created_by || []) as TmdbCreator[]).map((c) => c.name);
}

async function getDirectorFor(tmdbId: number, mediaType: string) {
  const langs: Array<["ko" | "en" | "ja", string]> = [
    ["ko", "ko-KR"],
    ["en", "en-US"],
    ["ja", "ja-JP"],
  ];
  const byLang: Record<"ko" | "en" | "ja", string> = { ko: "", en: "", ja: "" };
  for (const [key, lang] of langs) {
    let names = await getCrewDirectors(tmdbId, mediaType, lang);
    await sleep(60);
    if (names.length === 0 && mediaType === "tv") {
      names = await getCreatedBy(tmdbId, lang);
      await sleep(60);
    }
    byLang[key] = names.join(", ");
  }
  return {
    ko: byLang.ko || byLang.en || byLang.ja,
    en: byLang.en || byLang.ko || byLang.ja,
    ja: byLang.ja || byLang.en || byLang.ko,
  };
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set in .env.local");
    process.exit(1);
  }
  if (!API_KEY) {
    console.error("TMDB_API_KEY is not set in .env.local");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
  });

  const { rows } = await pool.query<Row>(
    `SELECT id, title_kr, tmdb_id, media_type FROM movies WHERE tmdb_id IS NOT NULL AND director IS NULL ORDER BY id`
  );

  console.log(`Backfilling director for ${rows.length} entries...`);

  let filled = 0;
  let empty = 0;
  let checked = 0;

  for (const row of rows) {
    checked++;
    const director = await getDirectorFor(row.tmdb_id, row.media_type);
    await pool.query(`UPDATE movies SET director = $1 WHERE id = $2`, [JSON.stringify(director), row.id]);
    if (director.ko || director.en || director.ja) filled++;
    else empty++;
    if (checked % 25 === 0) console.log(`...${checked}/${rows.length}`);
  }

  console.log(`\nDone. checked=${checked} filled=${filled} empty=${empty}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
