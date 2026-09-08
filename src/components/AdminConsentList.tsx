"use client";

import { useMemo, useState } from "react";

export type AdminConsentListItem = {
  id: string;
  n: number;
  created_at: string;
  full_name: string;
  email: string | null;
};

export function AdminConsentList({ rows }: { rows: AdminConsentListItem[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => r.full_name.toLowerCase().includes(needle) || String(r.n) === needle);
  }, [q, rows]);

  return (
    <div className="consent-list">
      <label>
        Buscar por nombre o número
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej. 12 o García" />
      </label>
      {filtered.length === 0 && <p className="hint">Ningún consentimiento coincide.</p>}
      {filtered.map((r) => (
        <a key={r.id} className="consent-row" href={`/admin/${r.id}`}>
          <span className="num">#{String(r.n).padStart(3, "0")}</span>
          <span className="who">
            <strong>{r.full_name}</strong>
            <span className="hint">
              {new Date(r.created_at).toLocaleString("es-ES")}
              {r.email ? ` · ${r.email}` : ""}
            </span>
          </span>
          <span className="open">Ver ficha</span>
        </a>
      ))}
    </div>
  );
}
