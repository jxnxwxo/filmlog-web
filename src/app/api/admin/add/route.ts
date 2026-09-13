import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { fetchFullMovieData, MediaType } from "@/lib/tmdb";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const tmdbId = Number(body.tmdbId);
  const mediaType = body.mediaType as MediaType;
  const grade = body.grade === "" || body.grade == null ? null : Number(body.grade);
  const category = body.category === "drama" ? "drama" : "movie";
  const comment = typeof body.comment === "string" && body.comment.trim() ? body.comment.trim() : null;

  if (!tmdbId || (mediaType !== "movie" && mediaType !== "tv")) {
    return NextResponse.json({ error: "tmdbId and mediaType are required" }, { status: 400 });
  }
  if (grade !== null && (isNaN(grade) || grade < 0 || grade > 5)) {
    return NextResponse.json({ error: "grade must be between 0 and 5" }, { status: 400 });
  }

  // Not a hard block: the same tmdb_id legitimately appears more than once
  // (separate seasons of the same show, e.g. Stranger Things S1/S2/S3), so we
  // just let the admin know rather than refusing the add.
  const existing = await query<{ title_kr: string }>(
    "SELECT title_kr FROM movies WHERE tmdb_id = $1 AND media_type = $2",
    [tmdbId, mediaType]
  );

  const data = await fetchFullMovieData(tmdbId, mediaType);
  const castSearch = [data.casting.ko, data.casting.en, data.casting.ja]
    .filter((v, i, arr) => v && arr.indexOf(v) === i)
    .join(" | ");

  const rows = await query<{ id: number }>(
    `INSERT INTO movies
       (title_kr, title_en, title_ja, year, country, genre, grade, casting,
        cast_search, overview, vote_average, poster_key, comment, category, tmdb_id, media_type)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING id`,
    [
      data.titleKr,
      data.titleEn,
      data.titleJa,
      data.year,
      JSON.stringify(data.country),
      JSON.stringify(data.genre),
      grade,
      JSON.stringify(data.casting),
      castSearch,
      JSON.stringify(data.overview),
      data.voteAverage,
      JSON.stringify(data.posterKey),
      comment,
      category,
      data.tmdbId,
      data.mediaType,
    ]
  );

  revalidatePath("/");

  return NextResponse.json({
    ok: true,
    id: rows[0].id,
    title: data.titleKr,
    alreadyLogged: existing.length > 0 ? existing.map((e) => e.title_kr) : null,
  });
}
