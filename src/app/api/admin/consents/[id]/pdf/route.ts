import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { id } = await ctx.params;
  const db = sql();
  const rows = await db`SELECT pdf_base64, full_name FROM consents WHERE id = ${id} LIMIT 1`;
  const row = rows[0];
  if (!row?.pdf_base64) return NextResponse.json({ error: "missing" }, { status: 404 });
  const buf = Buffer.from(String(row.pdf_base64), "base64");
  const name = String(row.full_name || "consentimiento").replace(/[^\w.-]+/g, "_");
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${name}.pdf"`,
    },
  });
}
