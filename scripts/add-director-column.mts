import path from "node:path";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

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
  await pool.query("ALTER TABLE movies ADD COLUMN IF NOT EXISTS director JSONB");
  console.log("director column ready.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
