import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { AdminConsentList, type AdminConsentListItem } from "@/components/AdminConsentList";
import { AdminLogout } from "@/components/AdminLogout";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const db = sql();
  const rows = await db`
    SELECT
      id, created_at, full_name, email,
      ROW_NUMBER() OVER (ORDER BY created_at ASC) AS n
    FROM consents
    ORDER BY created_at DESC
    LIMIT 200
  `;

  const list: AdminConsentListItem[] = rows.map((r) => ({
    id: String(r.id),
    n: Number(r.n),
    created_at: String(r.created_at),
    full_name: String(r.full_name),
    email: r.email ? String(r.email) : null,
  }));

  return (
    <main>
      <div className="card admin">
        <div className="admin-head">
          <h1>Consentimientos</h1>
          <AdminLogout />
        </div>
        <p className="sub">{list.length} personas · toca un nombre para ver la ficha completa</p>
        {list.length === 0 && (
          <p className="hint">Aún no hay consentimientos. Cuando alguien envíe el formulario, sale aquí.</p>
        )}
        {list.length > 0 && <AdminConsentList rows={list} />}
      </div>
    </main>
  );
}
