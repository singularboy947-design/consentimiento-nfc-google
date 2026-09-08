import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendReviewReminder } from "@/lib/email";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET || "";
  const auth = req.headers.get("authorization");
  const q = req.nextUrl.searchParams.get("secret");
  const ok = (auth === `Bearer ${secret}` || q === secret) && Boolean(secret);
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = sql();
  const due = await db`
    SELECT token, full_name, email, locale
    FROM consents
    WHERE review_sent_at IS NULL
      AND email IS NOT NULL
      AND BTRIM(email) <> ''
      AND review_email_at <= NOW()
    LIMIT 40
  `;

  let sent = 0;
  let failed = 0;
  for (const row of due) {
    try {
      await sendReviewReminder({
        to: String(row.email),
        name: String(row.full_name),
        locale: row.locale === "en" ? "en" : "es",
        token: String(row.token),
      });
      await db`
        UPDATE consents SET review_sent_at = NOW()
        WHERE token = ${String(row.token)} AND review_sent_at IS NULL
      `;
      sent += 1;
    } catch (e) {
      console.error("[review-reminders]", e);
      failed += 1;
    }
  }
  return NextResponse.json({ due: due.length, sent, failed });
}
