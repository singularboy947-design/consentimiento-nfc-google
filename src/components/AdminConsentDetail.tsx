"use client";

import { useState } from "react";
import { AdminLogout } from "@/components/AdminLogout";

export type AdminConsentDetailData = {
  id: string;
  n: number;
  created_at: string;
  locale: string;
  full_name: string;
  dni: string;
  birth_date: string;
  address: string;
  phone: string;
  email: string | null;
  is_minor: boolean;
  legal_rep_name: string | null;
  legal_rep_dni: string | null;
  signature_user: string;
  signature_rep: string | null;
  legal_accepted: boolean;
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

function day(v: string) {
  const s = String(v).slice(0, 10);
  const [y, m, d] = s.split("-");
  return d ? `${d}/${m}/${y}` : v;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="ficha-field">
      <span className="lbl">{label}</span>
      <p>{value || "—"}</p>
    </div>
  );
}

export function AdminConsentDetail({ row }: { row: AdminConsentDetailData }) {
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
    <div className="ficha">
      <div className="admin-head">
        <a className="back" href="/admin">
          ← Todos los consentimientos
        </a>
        <AdminLogout />
      </div>
      <p className="num-lg">#{String(row.n).padStart(3, "0")}</p>
      <h1>{row.full_name}</h1>
      <p className="sub">{new Date(row.created_at).toLocaleString("es-ES")} · {row.locale.toUpperCase()}</p>

      <h2>Datos del cliente</h2>
      <div className="ficha-grid">
        <Field label="Nombre y apellidos" value={row.full_name} />
        <Field label="DNI / NIE" value={row.dni} />
        <Field label="Fecha de nacimiento" value={day(row.birth_date)} />
        <Field label="Teléfono" value={row.phone} />
        <Field label="Email" value={row.email || ""} />
        <Field label="Dirección" value={row.address} />
        <Field label="Menor o no capaz" value={row.is_minor ? "sí" : "no"} />
        {row.is_minor && (
          <>
            <Field label="Representante legal" value={row.legal_rep_name || ""} />
            <Field label="DNI representante" value={row.legal_rep_dni || ""} />
          </>
        )}
        <Field label="Texto legal aceptado" value={flag(row.legal_accepted)} />
      </div>

      <h2>Firma</h2>
      {row.signature_user ? (
        <img className="sig-preview" src={row.signature_user} alt="Firma del cliente" />
      ) : (
        <p className="hint">Sin firma</p>
      )}
      {row.is_minor && row.signature_rep && (
        <>
          <p className="lbl">Firma del representante</p>
          <img className="sig-preview" src={row.signature_rep} alt="Firma del representante" />
        </>
      )}

      <h2>Trabajo (lo rellena el estudio)</h2>
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

      <h2>Reseña</h2>
      <p className="hint">
        Mail enviado {flag(row.review_sent_at)} · abierto {flag(row.email_opened_at)} · clic{" "}
        {flag(row.review_clicked_at)}
      </p>
      <a className="pdf-link" href={`/api/admin/consents/${row.id}/pdf`}>
        Descargar PDF
      </a>
    </div>
  );
}
