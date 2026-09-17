import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tmdbId = Number(searchParams.get("tmdbId"));
  const mediaType = searchParams.get("mediaType");

  if (!tmdbId || (mediaType !== "movie" && mediaType !== "tv")) {
    return NextResponse.json({ error: "tmdbId and mediaType are required" }, { status: 400 });
  }

  const rows = await query<{ id: number; title_kr: string; grade: string | null }>(
    "SELECT id, title_kr, grade FROM movies WHERE tmdb_id = $1 AND media_type = $2",
    [tmdbId, mediaType]
  );

  return NextResponse.json({
    exists: rows.length > 0,
    titles: rows.map((r) => r.title_kr),
    movie: rows[0] ? { id: rows[0].id, titleKr: rows[0].title_kr, grade: rows[0].grade } : null,
  });
}
