import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const rows = await query<{ id: number; title_kr: string }>(
    "DELETE FROM movies WHERE id = $1 RETURNING id, title_kr",
    [id]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  }

  revalidatePath("/");

  return NextResponse.json({ ok: true, title: rows[0].title_kr });
}
