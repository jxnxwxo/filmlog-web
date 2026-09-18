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

interface TmdbCollection {
  id: number;
  name: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getCollection(id: number, lang: string): Promise<TmdbCollection | null> {
  const url = `${BASE}/movie/${id}?api_key=${API_KEY}&language=${lang}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data.belongs_to_collection || null;
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

  // TV series have no belongs_to_collection field on TMDb, so only movies need backfilling.
  const { rows } = await pool.query<Row>(
    `SELECT id, title_kr, tmdb_id, media_type FROM movies
     WHERE tmdb_id IS NOT NULL AND media_type = 'movie' AND collection_id IS NULL
     ORDER BY id`
  );

  console.log(`Backfilling collection for ${rows.length} movies...`);

  let filled = 0;
  let empty = 0;
  let checked = 0;

  for (const row of rows) {
    checked++;
    const ko = await getCollection(row.tmdb_id, "ko-KR");
    await sleep(60);
    const en = await getCollection(row.tmdb_id, "en-US");
    await sleep(60);
    const ja = await getCollection(row.tmdb_id, "ja-JP");
    await sleep(60);

    const collectionId = ko?.id ?? en?.id ?? null;
    const collection = {
      ko: ko?.name || en?.name || "",
      en: en?.name || ko?.name || "",
      ja: ja?.name || en?.name || "",
    };

    await pool.query(`UPDATE movies SET collection_id = $1, collection = $2 WHERE id = $3`, [
      collectionId,
      JSON.stringify(collection),
      row.id,
    ]);
    if (collectionId) filled++;
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
