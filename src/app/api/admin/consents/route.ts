import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "auth" }, { status: 401 });
  const db = sql();
  const rows = await db`
    SELECT
      id, created_at, full_name, dni, email, phone, body_zone, locale,
      review_sent_at, email_opened_at, review_clicked_at, token
    FROM consents
    ORDER BY created_at DESC
    LIMIT 200
  `;
  return NextResponse.json({ rows });
}
