"use client";

import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { legalSections, type Locale } from "@/lib/legal";
import { STUDIO } from "@/lib/studio";
import { t } from "@/lib/ui";

function usePad(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const pad = useRef<SignaturePad | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);
      pad.current?.clear();
      setDirty(false);
    };
    pad.current = new SignaturePad(canvas, {
      backgroundColor: "rgb(255,255,255)",
      penColor: "rgb(20,20,22)",
      minWidth: 0.5,
      maxWidth: 2.5,
    });
    pad.current.addEventListener("beginStroke", () => setDirty(true));
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [canvasRef]);

  return {
    dirty,
    clear: () => {
      pad.current?.clear();
      setDirty(false);
    },
    dataUrl: () => (pad.current && !pad.current.isEmpty() ? pad.current.toDataURL("image/png") : ""),
  };
}

export function ConsentForm() {
  const [locale, setLocale] = useState<Locale>("es");
  const copy = t(locale);
  const userCanvas = useRef<HTMLCanvasElement>(null);
  const repCanvas = useRef<HTMLCanvasElement>(null);
  const userPad = usePad(userCanvas);
  const repPad = usePad(repCanvas);
  const [open, setOpen] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [minor, setMinor] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");

  const signed = userPad.dirty;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const signatureUser = userPad.dataUrl();
    if (!signatureUser || !accepted) {
      setStatus("err");
      return;
    }
    setStatus("saving");
    const res = await fetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale,
        fullName: fd.get("fullName"),
        dni: fd.get("dni"),
        birthDate: fd.get("birthDate"),
        address: fd.get("address"),
        phone: fd.get("phone"),
        email: fd.get("email"),
        isMinor: minor,
        legalRepName: fd.get("legalRepName"),
        legalRepDni: fd.get("legalRepDni"),
        signatureUser,
        signatureRep: minor ? repPad.dataUrl() : "",
        legalAccepted: accepted,
      }),
    });
    setStatus(res.ok ? "ok" : "err");
  }

  if (status === "ok") {
    return (
      <div className="card">
        <p className="thanks">{copy.thanks}</p>
        <p className="hint" style={{ textAlign: "center" }}>
          {copy.thanksMail}
        </p>
      </div>
    );
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <div className="langs">
        <button type="button" className={locale === "es" ? "on" : ""} onClick={() => setLocale("es")}>
          ES
        </button>
        <button type="button" className={locale === "en" ? "on" : ""} onClick={() => setLocale("en")}>
          EN
        </button>
      </div>
      <h1>{copy.title}</h1>
      <p className="sub">{copy.subtitle}</p>
      <p className="studio">
        {STUDIO.name}
        <br />
        {STUDIO.applicatorName} · {STUDIO.phone}
      </p>

      <label>
        {copy.fullName}
        <input name="fullName" required autoComplete="name" />
      </label>
      <label>
        {copy.dni}
        <input name="dni" required />
      </label>
      <label>
        {copy.birthDate}
        <input name="birthDate" type="date" required className="birth" />
      </label>
      <label>
        {copy.address}
        <input name="address" required autoComplete="street-address" />
      </label>
      <label>
        {copy.phone}
        <input name="phone" type="tel" required autoComplete="tel" />
      </label>
      <label>
        {copy.email}
        <input name="email" type="email" autoComplete="email" />
      </label>
      <label className="check">
        <input type="checkbox" checked={minor} onChange={(e) => setMinor(e.target.checked)} />
        {copy.minor}
      </label>
      {minor && (
        <>
          <label>
            {copy.repName}
            <input name="legalRepName" required={minor} />
          </label>
          <label>
            {copy.repDni}
            <input name="legalRepDni" required={minor} />
          </label>
        </>
      )}

      <p className="lbl">{copy.sign}</p>
      <div className={`pad ${signed ? "has" : ""}`}>
        <canvas ref={userCanvas} />
        {!signed && <span>{copy.placeholder}</span>}
      </div>
      <button type="button" className="ghost" onClick={userPad.clear}>
        {copy.clear}
      </button>

      {minor && (
        <>
          <p className="lbl">{copy.signRep}</p>
          <div className={`pad ${repPad.dirty ? "has" : ""}`}>
            <canvas ref={repCanvas} />
            {!repPad.dirty && <span>{copy.placeholder}</span>}
          </div>
          <button type="button" className="ghost" onClick={repPad.clear}>
            {copy.clear}
          </button>
        </>
      )}

      <div className={`legal ${signed ? "" : "locked"}`}>
        <p className="lbl">{copy.legal}</p>
        {!signed && <p className="hint">{copy.signFirst}</p>}
        {legalSections(locale).map((s) => (
          <details
            key={s.id}
            open={open === s.id}
            onToggle={(e) => {
              if ((e.target as HTMLDetailsElement).open) setOpen(s.id);
            }}
          >
            <summary>{s.title}</summary>
            <p>{s.body}</p>
          </details>
        ))}
        <label className="check">
          <input
            type="checkbox"
            checked={accepted}
            disabled={!signed}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          {copy.accept}
        </label>
      </div>

      <button type="submit" className="go" disabled={!signed || !accepted || status === "saving"}>
        {status === "saving" ? copy.sending : copy.submit}
      </button>
      {status === "err" && <p className="err">{copy.error}</p>}
    </form>
  );
}
