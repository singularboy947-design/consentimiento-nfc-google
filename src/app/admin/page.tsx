import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { AdminConsentList, type AdminConsent } from "@/components/AdminConsentList";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const db = sql();
  const rows = await db`
    SELECT
      id, created_at, full_name, email, phone, body_zone,
      ink_brand, ink_lot, ink_expiry,
      review_sent_at, email_opened_at, review_clicked_at
    FROM consents
    ORDER BY created_at DESC
    LIMIT 200
  `;

  const list: AdminConsent[] = rows.map((r) => ({
    id: String(r.id),
    created_at: String(r.created_at),
    full_name: String(r.full_name),
    email: r.email ? String(r.email) : null,
    phone: String(r.phone),
    body_zone: String(r.body_zone || ""),
    ink_brand: r.ink_brand ? String(r.ink_brand) : null,
    ink_lot: r.ink_lot ? String(r.ink_lot) : null,
    ink_expiry: r.ink_expiry ? String(r.ink_expiry) : null,
    review_sent_at: r.review_sent_at ? String(r.review_sent_at) : null,
    email_opened_at: r.email_opened_at ? String(r.email_opened_at) : null,
    review_clicked_at: r.review_clicked_at ? String(r.review_clicked_at) : null,
  }));

  return (
    <main>
      <div className="card admin">
        <h1>Consentimientos</h1>
        <p className="sub">
          {list.length} registros · zona, tinta, lote y caducidad los rellena el estudio. El PDF se
          actualiza al guardar.
        </p>
        {list.length === 0 && (
          <p className="hint">Aún no hay consentimientos. Cuando alguien envíe el formulario, sale aquí.</p>
        )}
        <AdminConsentList rows={list} />
      </div>
    </main>
  );
}
