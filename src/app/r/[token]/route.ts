import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { reviewUrl } from "@/lib/email";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params;
  try {
    const db = sql();
    await db`
      UPDATE consents
      SET review_clicked_at = COALESCE(review_clicked_at, NOW())
      WHERE token = ${token}
    `;
  } catch {
    /* still redirect */
  }
  return NextResponse.redirect(reviewUrl(), 302);
}
