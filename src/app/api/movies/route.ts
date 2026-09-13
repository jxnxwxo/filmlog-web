import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const rows = await query(
    `SELECT id, title_kr, title_en, title_ja, year, country, genre, grade,
            casting, cast_search, overview, vote_average, poster_key, comment,
            category, tmdb_id, media_type, created_at
     FROM movies
     ORDER BY title_kr`
  );

  const items = rows.map((r) => ({
    id: r.id,
    titleKr: r.title_kr,
    titleEn: r.title_en,
    titleJa: r.title_ja,
    year: r.year,
    country: r.country,
    genre: r.genre,
    grade: r.grade,
    casting: r.casting,
    castSearch: r.cast_search,
    overview: r.overview,
    voteAverage: r.vote_average,
    posterKey: r.poster_key,
    comment: r.comment,
    category: r.category,
    tmdbId: r.tmdb_id,
    mediaType: r.media_type,
  }));

  return NextResponse.json({ items });
}
