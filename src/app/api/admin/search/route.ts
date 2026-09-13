import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { searchTmdb } from "@/lib/tmdb";

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const q = typeof body.query === "string" ? body.query.trim() : "";
  if (!q) return NextResponse.json({ results: [] });

  const [movies, shows] = await Promise.all([
    searchTmdb(q, "movie"),
    searchTmdb(q, "tv"),
  ]);

  const results = [...movies, ...shows].sort((a, b) => b.popularity - a.popularity);
  return NextResponse.json({ results });
}
