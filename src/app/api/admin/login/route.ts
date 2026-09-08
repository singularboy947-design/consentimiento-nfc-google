import { NextRequest, NextResponse } from "next/server";
import { credentialsOk, setAdminCookieHeader } from "@/lib/admin-session";
import { clientIp, rateLimitClear, rateLimitTake } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const limit = rateLimitTake(`login:${ip}`);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "");
  const password = String(body.password || "");
  const ok = await credentialsOk(email, password);
  if (!ok) {
    return NextResponse.json({ error: "bad" }, { status: 401 });
  }

  rateLimitClear(`login:${ip}`);
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", await setAdminCookieHeader());
  return res;
}
