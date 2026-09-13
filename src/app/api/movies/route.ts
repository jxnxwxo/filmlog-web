import { NextResponse } from "next/server";
import { getAllMovies } from "@/lib/movies";

export async function GET() {
  const items = await getAllMovies();
  return NextResponse.json({ items });
}
