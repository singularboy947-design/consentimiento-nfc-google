"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setErr(true);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main>
      <form className="card" onSubmit={onSubmit}>
        <h1>Panel</h1>
        <p className="sub">Solo el estudio.</p>
        <label>
          Contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="go" type="submit">
          Entrar
        </button>
        {err && <p className="err">Contraseña incorrecta.</p>}
      </form>
    </main>
  );
}
