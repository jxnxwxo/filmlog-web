import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

interface FinalItem {
  titleKr: string;
  titleEn: string;
  titleJa: string;
  year: string | null;
  country: { ko: string; en: string; ja: string };
  genre: { ko: string[]; en: string[]; ja: string[] };
  grade: string | null;
  casting: { ko: string; en: string; ja: string };
  castSearch: string;
  overview: { ko: string; en: string; ja: string };
  voteAverage: number | null;
  category: "movie" | "drama";
  tmdbId: number;
  mediaType: "movie" | "tv";
}

interface MatchedItem {
  tmdbId?: number;
  mediaType?: string;
  posterPath?: string | null;
  posterPathEn?: string | null;
  posterPathJa?: string | null;
}

const filmlogDir = path.resolve(process.cwd(), "..", "filmlog");
const finalItems: FinalItem[] = JSON.parse(
  fs.readFileSync(path.join(filmlogDir, "filmlog_final_i18n.json"), "utf-8")
);
const matchedItems: MatchedItem[] = JSON.parse(
  fs.readFileSync(path.join(filmlogDir, "tmdb_matched.json"), "utf-8")
);

const posterByKey = new Map<string, MatchedItem>();
for (const m of matchedItems) {
  if (m.tmdbId && m.mediaType) posterByKey.set(`${m.tmdbId}:${m.mediaType}`, m);
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set in .env.local");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
  });

  const schema = fs.readFileSync(path.join(process.cwd(), "scripts", "schema.sql"), "utf-8");
  await pool.query(schema);
  console.log("Schema ready.");

  let inserted = 0;
  let skipped = 0;

  for (const it of finalItems) {
    const m = posterByKey.get(`${it.tmdbId}:${it.mediaType}`);
    const posterKey = {
      ko: m?.posterPath ?? null,
      en: m?.posterPathEn ?? m?.posterPath ?? null,
      ja: m?.posterPathJa ?? m?.posterPath ?? null,
    };

    const res = await pool.query(
      `INSERT INTO movies
         (title_kr, title_en, title_ja, year, country, genre, grade, casting,
          cast_search, overview, vote_average, poster_key, category, tmdb_id, media_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING id`,
      [
        it.titleKr,
        it.titleEn,
        it.titleJa,
        it.year,
        JSON.stringify(it.country),
        JSON.stringify(it.genre),
        it.grade === "" || it.grade == null ? null : Number(it.grade),
        JSON.stringify(it.casting),
        it.castSearch,
        JSON.stringify(it.overview),
        it.voteAverage,
        JSON.stringify(posterKey),
        it.category,
        it.tmdbId,
        it.mediaType,
      ]
    );
    if (res.rowCount && res.rowCount > 0) inserted++;
    else skipped++;
  }

  console.log(`Done. inserted=${inserted} skipped(existing)=${skipped} total=${finalItems.length}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
