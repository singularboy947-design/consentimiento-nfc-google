import { createHmac } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "sb_admin";

export function adminToken() {
  const secret = process.env.DASHBOARD_PASSWORD;
  if (!secret) throw new Error("Falta DASHBOARD_PASSWORD");
  return createHmac("sha256", secret).update("singularboy-admin").digest("hex");
}

export async function isAdmin() {
  const jar = await cookies();
  return jar.get(COOKIE)?.value === adminToken();
}

export function adminCookieHeader() {
  return `${COOKIE}=${adminToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`;
}

export function clearAdminCookieHeader() {
  return `${COOKIE}=; Path=/; HttpOnly; Max-Age=0`;
}
