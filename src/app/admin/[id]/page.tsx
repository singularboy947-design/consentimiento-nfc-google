import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { AdminConsentDetail, type AdminConsentDetailData } from "@/components/AdminConsentDetail";

export const dynamic = "force-dynamic";

export default async function AdminConsentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const db = sql();
  const rows = await db`
    SELECT *
    FROM (
      SELECT
        id, created_at, locale, full_name, dni, birth_date, address, phone, email,
        is_minor, legal_rep_name, legal_rep_dni, signature_user, signature_rep,
        legal_accepted, body_zone, ink_brand, ink_lot, ink_expiry,
        review_sent_at, email_opened_at, review_clicked_at,
        ROW_NUMBER() OVER (ORDER BY created_at ASC) AS n
      FROM consents
    ) t
    WHERE id = ${id}
    LIMIT 1
  `;
  const r = rows[0];
  if (!r) notFound();

  const row: AdminConsentDetailData = {
    id: String(r.id),
    n: Number(r.n),
    created_at: String(r.created_at),
    locale: String(r.locale || "es"),
    full_name: String(r.full_name),
    dni: String(r.dni),
    birth_date: String(r.birth_date),
    address: String(r.address),
    phone: String(r.phone),
    email: r.email ? String(r.email) : null,
    is_minor: Boolean(r.is_minor),
    legal_rep_name: r.legal_rep_name ? String(r.legal_rep_name) : null,
    legal_rep_dni: r.legal_rep_dni ? String(r.legal_rep_dni) : null,
    signature_user: String(r.signature_user || ""),
    signature_rep: r.signature_rep ? String(r.signature_rep) : null,
    legal_accepted: Boolean(r.legal_accepted),
    body_zone: String(r.body_zone || ""),
    ink_brand: r.ink_brand ? String(r.ink_brand) : null,
    ink_lot: r.ink_lot ? String(r.ink_lot) : null,
    ink_expiry: r.ink_expiry ? String(r.ink_expiry) : null,
    review_sent_at: r.review_sent_at ? String(r.review_sent_at) : null,
    email_opened_at: r.email_opened_at ? String(r.email_opened_at) : null,
    review_clicked_at: r.review_clicked_at ? String(r.review_clicked_at) : null,
  };

  return (
    <main>
      <div className="card admin">
        <AdminConsentDetail row={row} />
      </div>
    </main>
  );
}
