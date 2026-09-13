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
  const grade = body.grade === "" || body.grade == null ? null : Number(body.grade);
  const comment = typeof body.comment === "string" && body.comment.trim() ? body.comment.trim() : null;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  if (grade !== null && (isNaN(grade) || grade < 0 || grade > 5)) {
    return NextResponse.json({ error: "grade must be between 0 and 5" }, { status: 400 });
  }

  const rows = await query<{ id: number; title_kr: string }>(
    `UPDATE movies SET grade = $1, comment = $2 WHERE id = $3 RETURNING id, title_kr`,
    [grade, comment, id]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  }

  revalidatePath("/");

  return NextResponse.json({ ok: true, id: rows[0].id, title: rows[0].title_kr });
}
