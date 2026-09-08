import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { sql } from "@/lib/db";
import { LEGAL_VERSION } from "@/lib/studio";
import { buildConsentPdf } from "@/lib/pdf";
import type { Locale } from "@/lib/legal";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const locale: Locale = b.locale === "en" ? "en" : "es";
    const fullName = String(b.fullName || "").trim();
    const dni = String(b.dni || "").trim();
    const birthDate = String(b.birthDate || "").trim();
    const address = String(b.address || "").trim();
    const phone = String(b.phone || "").trim();
    const email = String(b.email || "").trim();
    const bodyZone = String(b.bodyZone || "").trim();
    const signatureUser = String(b.signatureUser || "");
    const legalAccepted = Boolean(b.legalAccepted);

    if (!fullName || !dni || !birthDate || !address || !phone || !bodyZone || !signatureUser || !legalAccepted) {
      return NextResponse.json({ error: "incomplete" }, { status: 400 });
    }

    const token = randomBytes(24).toString("hex");
    const createdAt = new Date();
    const reviewAt = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000);
    const isMinor = Boolean(b.isMinor);
    const pdf = await buildConsentPdf({
      locale,
      fullName,
      dni,
      birthDate,
      address,
      phone,
      email,
      bodyZone,
      inkBrand: String(b.inkBrand || ""),
      inkLot: String(b.inkLot || ""),
      inkExpiry: String(b.inkExpiry || ""),
      isMinor,
      legalRepName: String(b.legalRepName || ""),
      legalRepDni: String(b.legalRepDni || ""),
      signatureUser,
      signatureRep: String(b.signatureRep || ""),
      createdAt,
    });
    const pdf_base64 = Buffer.from(pdf).toString("base64");
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "";

    const db = sql();
    await db`
      INSERT INTO consents (
        token, locale, full_name, dni, birth_date, address, phone, email,
        body_zone, ink_brand, ink_lot, ink_expiry, is_minor, legal_rep_name,
        legal_rep_dni, signature_user, signature_rep, legal_accepted, legal_version,
        pdf_base64, created_at, review_email_at, ip
      ) VALUES (
        ${token}, ${locale}, ${fullName}, ${dni}, ${birthDate}, ${address}, ${phone},
        ${email || null}, ${bodyZone}, ${String(b.inkBrand || "") || null},
        ${String(b.inkLot || "") || null}, ${String(b.inkExpiry || "") || null},
        ${isMinor}, ${String(b.legalRepName || "") || null},
        ${String(b.legalRepDni || "") || null}, ${signatureUser},
        ${String(b.signatureRep || "") || null}, ${true}, ${LEGAL_VERSION},
        ${pdf_base64}, ${createdAt.toISOString()}, ${reviewAt.toISOString()}, ${ip}
      )
    `;

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
