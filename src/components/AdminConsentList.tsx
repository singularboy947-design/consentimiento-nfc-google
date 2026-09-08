"use client";

import { useState } from "react";

export type AdminConsent = {
  id: string;
  created_at: string;
  full_name: string;
  email: string | null;
  phone: string;
  body_zone: string;
  ink_brand: string | null;
  ink_lot: string | null;
  ink_expiry: string | null;
  review_sent_at: string | null;
  email_opened_at: string | null;
  review_clicked_at: string | null;
};

function flag(v: unknown) {
  return v ? "sí" : "—";
}

export function AdminConsentList({ rows }: { rows: AdminConsent[] }) {
  return (
    <div className="consent-list">
      {rows.map((r) => (
        <JobCard key={r.id} row={r} />
      ))}
    </div>
  );
}

function JobCard({ row }: { row: AdminConsent }) {
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setStatus("saving");
    const res = await fetch(`/api/admin/consents/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bodyZone: fd.get("bodyZone"),
        inkBrand: fd.get("inkBrand"),
        inkLot: fd.get("inkLot"),
        inkExpiry: fd.get("inkExpiry"),
      }),
    });
    setStatus(res.ok ? "ok" : "err");
  }

  return (
    <article className="consent-card">
      <header>
        <strong>{row.full_name}</strong>
        <span className="hint">{new Date(row.created_at).toLocaleString("es-ES")}</span>
      </header>
      <p className="hint">
        {row.email || "sin email"} · {row.phone} · mail {flag(row.review_sent_at)} · abierto{" "}
        {flag(row.email_opened_at)} · clic {flag(row.review_clicked_at)}
      </p>
      <form className="job" onSubmit={onSubmit}>
        <label>
          Zona anatómica del tatuaje
          <input name="bodyZone" defaultValue={row.body_zone || ""} />
        </label>
        <label>
          Marca de tinta / pigmento
          <input name="inkBrand" defaultValue={row.ink_brand || ""} />
        </label>
        <label>
          Lote
          <input name="inkLot" defaultValue={row.ink_lot || ""} />
        </label>
        <label>
          Caducidad
          <input name="inkExpiry" type="month" defaultValue={row.ink_expiry || ""} />
        </label>
        <button className="go" type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Guardando…" : status === "ok" ? "Guardado" : "Guardar trabajo"}
        </button>
        {status === "err" && <p className="err">No se pudo guardar.</p>}
      </form>
      <a href={`/api/admin/consents/${row.id}/pdf`}>descargar PDF</a>
    </article>
  );
}
