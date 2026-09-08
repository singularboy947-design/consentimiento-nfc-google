"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<"idle" | "bad" | "rate">("idle");
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("idle");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.status === 429) {
      setErr("rate");
      return;
    }
    if (!res.ok) {
      setErr("bad");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main>
      <form className="card" onSubmit={onSubmit}>
        <h1>Panel</h1>
        <p className="sub">Solo el estudio. Email y contraseña.</p>
        <label>
          Email
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button className="go" type="submit">
          Entrar
        </button>
        {err === "bad" && <p className="err">Email o contraseña incorrectos.</p>}
        {err === "rate" && <p className="err">Demasiados intentos. Espera 15 minutos.</p>}
      </form>
    </main>
  );
}
