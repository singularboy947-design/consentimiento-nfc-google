import { NextRequest, NextResponse } from "next/server";
import { clearAdminCookieHeader } from "@/lib/admin-session";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/admin/login", req.url), 303);
  res.headers.set("Set-Cookie", clearAdminCookieHeader());
  return res;
}
