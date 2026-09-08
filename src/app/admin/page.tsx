import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

function flag(v: unknown) {
  return v ? "sí" : "—";
}

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const db = sql();
  const rows = await db`
    SELECT
      id, created_at, full_name, email, phone, body_zone, locale,
      review_sent_at, email_opened_at, review_clicked_at
    FROM consents
    ORDER BY created_at DESC
    LIMIT 200
  `;

  return (
    <main>
      <div className="card admin">
        <h1>Consentimientos</h1>
        <p className="sub">{rows.length} registros · el clic de reseña es quien abrió el enlace de Google (Google no confirma si publicó)</p>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Zona</th>
              <th>Mail</th>
              <th>Abierto</th>
              <th>Clic reseña</th>
              <th>PDF</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r.id)}>
                <td>{new Date(String(r.created_at)).toLocaleString("es-ES")}</td>
                <td>{String(r.full_name)}</td>
                <td>{String(r.email || "—")}</td>
                <td>{String(r.body_zone)}</td>
                <td>
                  <span className={`dot ${r.review_sent_at ? "yes" : ""}`} />
                  {flag(r.review_sent_at)}
                </td>
                <td>
                  <span className={`dot ${r.email_opened_at ? "yes" : ""}`} />
                  {flag(r.email_opened_at)}
                </td>
                <td>
                  <span className={`dot ${r.review_clicked_at ? "yes" : ""}`} />
                  {flag(r.review_clicked_at)}
                </td>
                <td>
                  <a href={`/api/admin/consents/${r.id}/pdf`}>descargar</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
