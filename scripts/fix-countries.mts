import path from "node:path";
import { Pool } from "pg";
import dotenv from "dotenv";
import { normalizeCountry } from "../src/lib/tmdb";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const API_KEY = process.env.TMDB_API_KEY;

interface Row {
  id: number;
  title_kr: string;
  tmdb_id: number;
  media_type: "movie" | "tv";
  country: { ko: string; en: string; ja: string } | null;
}

interface TmdbCountry {
  iso_3166_1?: string;
  name?: string;
}
interface TmdbDetails {
  production_countries?: TmdbCountry[];
  origin_country?: string[];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getRawCountry(tmdbId: number, mediaType: "movie" | "tv"): Promise<string> {
  const url = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${API_KEY}&language=en-US`;
  const res = await fetch(url);
  if (!res.ok) return "";
  const d = (await res.json()) as TmdbDetails;
  if (d.origin_country && d.origin_country.length > 0) return d.origin_country[0];
  const pc = d.production_countries || [];
  return pc[0]?.iso_3166_1 || pc[0]?.name || "";
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
    `SELECT id, title_kr, tmdb_id, media_type, country FROM movies WHERE tmdb_id IS NOT NULL ORDER BY id`
  );

  console.log(`Checking ${rows.length} entries against TMDB origin_country...`);

  let changed = 0;
  let checked = 0;
  const changes: string[] = [];

  for (const row of rows) {
    checked++;
    const raw = await getRawCountry(row.tmdb_id, row.media_type);
    if (!raw) {
      console.log(`[skip] ${row.title_kr} (id=${row.id}) — TMDB returned no country data`);
      await sleep(60);
      continue;
    }
    const correct = normalizeCountry(raw);
    const current = row.country;
    if (!current || current.ko !== correct.ko) {
      changes.push(`${row.title_kr}: ${current?.ko ?? "(none)"} -> ${correct.ko}`);
      await pool.query(`UPDATE movies SET country = $1 WHERE id = $2`, [
        JSON.stringify(correct),
        row.id,
      ]);
      changed++;
    }
    if (checked % 50 === 0) console.log(`...${checked}/${rows.length}`);
    await sleep(60);
  }

  console.log("\n=== Changes ===");
  changes.forEach((c) => console.log(c));
  console.log(`\nDone. checked=${checked} changed=${changed}`);

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
