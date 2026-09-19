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
  casting: { ko: string; en: string; ja: string };
  director: { ko: string; en: string; ja: string };
}

interface NamedPerson {
  id: number;
  name: string;
}

const HANGUL_RE = /[가-힣]/;
const HAN_RE = /[一-鿿]/;
function isUntranslatedHanName(name: string): boolean {
  return HAN_RE.test(name) && !HANGUL_RE.test(name);
}
function localizeKoNames(koList: NamedPerson[], enList: NamedPerson[]): string[] {
  const enById = new Map(enList.map((p) => [p.id, p.name]));
  return koList.map((p) => (isUntranslatedHanName(p.name) && enById.get(p.id)) || p.name);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getCredits(id: number, mediaType: string, lang: string) {
  const url = `${BASE}/${mediaType}/${id}/credits?api_key=${API_KEY}&language=${lang}`;
  const res = await fetch(url);
  if (!res.ok) return { cast: [] as NamedPerson[], directors: [] as NamedPerson[] };
  const data = await res.json();
  const cast = (data.cast || []) as (NamedPerson & { order?: number })[];
  const crew = (data.crew || []) as (NamedPerson & { job?: string })[];
  return {
    cast: cast.slice(0, 6).map((c) => ({ id: c.id, name: c.name })),
    directors: crew.filter((c) => c.job === "Director").map((c) => ({ id: c.id, name: c.name })),
  };
}

async function getCreatedBy(id: number, lang: string): Promise<NamedPerson[]> {
  const url = `${BASE}/tv/${id}?api_key=${API_KEY}&language=${lang}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return ((data.created_by || []) as NamedPerson[]).map((c) => ({ id: c.id, name: c.name }));
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
    `SELECT id, title_kr, tmdb_id, media_type, casting, director FROM movies WHERE tmdb_id IS NOT NULL ORDER BY id`
  );

  const flagged = rows.filter(
    (r) => HAN_RE.test(r.casting?.ko || "") || HAN_RE.test(r.director?.ko || "")
  );
  console.log(`${rows.length} movies checked, ${flagged.length} have an untranslated Han name in casting/director.`);

  let updated = 0;
  for (const row of flagged) {
    const [credKo, credEn] = await Promise.all([
      getCredits(row.tmdb_id, row.media_type, "ko-KR"),
      getCredits(row.tmdb_id, row.media_type, "en-US"),
    ]);
    await sleep(60);

    let directorKoList = credKo.directors;
    let directorEnList = credEn.directors;
    if (row.media_type === "tv" && directorKoList.length === 0) {
      const [createdKo, createdEn] = await Promise.all([getCreatedBy(row.tmdb_id, "ko-KR"), getCreatedBy(row.tmdb_id, "en-US")]);
      await sleep(60);
      directorKoList = createdKo;
      directorEnList = createdEn;
    }

    const newCastKo = localizeKoNames(credKo.cast, credEn.cast).join(", ");
    const newDirectorKo = localizeKoNames(directorKoList, directorEnList).join(", ");

    const casting = { ...row.casting, ko: newCastKo || row.casting.ko };
    const director = { ...row.director, ko: newDirectorKo || row.director.ko };
    const castSearch = [casting.ko, casting.en, casting.ja].filter((v, i, arr) => v && arr.indexOf(v) === i).join(" | ");

    if (casting.ko !== row.casting.ko || director.ko !== row.director.ko) {
      await pool.query(`UPDATE movies SET casting = $1, director = $2, cast_search = $3 WHERE id = $4`, [
        JSON.stringify(casting),
        JSON.stringify(director),
        castSearch,
        row.id,
      ]);
      updated++;
      console.log(`fixed: ${row.title_kr}`);
      if (row.casting.ko !== casting.ko) console.log(`  cast: ${row.casting.ko}  ->  ${casting.ko}`);
      if (row.director.ko !== director.ko) console.log(`  dir:  ${row.director.ko}  ->  ${director.ko}`);
    }
  }

  console.log(`\nDone. ${updated}/${flagged.length} rows updated.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
