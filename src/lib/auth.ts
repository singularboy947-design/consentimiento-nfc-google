import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminSessionOk } from "@/lib/admin-session";

export async function isAdmin() {
  const jar = await cookies();
  return adminSessionOk(jar.get(ADMIN_COOKIE)?.value);
}
