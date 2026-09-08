import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get("t");
  if (t) {
    try {
      const db = sql();
      await db`
        UPDATE consents
        SET email_opened_at = COALESCE(email_opened_at, NOW())
        WHERE token = ${t}
      `;
    } catch {
      /* tracking never blocks */
    }
  }
  const gif = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );
  return new NextResponse(gif, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
