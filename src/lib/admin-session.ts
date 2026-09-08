const enc = new TextEncoder();

export const ADMIN_COOKIE = "sb_admin";

export function configuredAdminEmail() {
  return (
    process.env.ADMIN_EMAIL ||
    process.env.GMAIL_USER ||
    "singularboy947@gmail.com"
  )
    .trim()
    .toLowerCase();
}

export async function hmacHex(secret: string, msg: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const buf = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function timingSafeEqualStr(a: string, b: string) {
  const aa = enc.encode(a);
  const bb = enc.encode(b);
  const len = Math.max(aa.length, bb.length, 1);
  let diff = aa.length === bb.length ? 0 : 1;
  for (let i = 0; i < len; i++) {
    diff |= (aa[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

export async function expectedAdminToken() {
  const secret = process.env.DASHBOARD_PASSWORD || "";
  if (!secret) return "";
  return hmacHex(secret, "singularboy-admin-v2");
}

export async function adminSessionOk(cookieValue: string | undefined) {
  const expected = await expectedAdminToken();
  if (!expected || !cookieValue) return false;
  return timingSafeEqualStr(cookieValue, expected);
}

function cookieSecure() {
  return process.env.VERCEL || process.env.NODE_ENV === "production" ? "; Secure" : "";
}

export async function setAdminCookieHeader() {
  const token = await expectedAdminToken();
  return `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000${cookieSecure()}`;
}

export function clearAdminCookieHeader() {
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${cookieSecure()}`;
}

export async function credentialsOk(email: string, password: string) {
  const secret = process.env.DASHBOARD_PASSWORD || "";
  if (!secret) return false;
  const wantEmail = configuredAdminEmail();
  const gotEmail = email.trim().toLowerCase();
  const [gotE, wantE, gotP, wantP] = await Promise.all([
    hmacHex(secret, `email:${gotEmail}`),
    hmacHex(secret, `email:${wantEmail}`),
    hmacHex(secret, `pass:${password}`),
    hmacHex(secret, `pass:${secret}`),
  ]);
  return timingSafeEqualStr(gotE, wantE) && timingSafeEqualStr(gotP, wantP);
}
