import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { buildConsentPdf } from "@/lib/pdf";
import type { Locale } from "@/lib/legal";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { id } = await ctx.params;
  const b = await req.json();
  const bodyZone = String(b.bodyZone || "").trim();
  const inkBrand = String(b.inkBrand || "").trim();
  const inkLot = String(b.inkLot || "").trim();
  const inkExpiry = String(b.inkExpiry || "").trim();

  const db = sql();
  const rows = await db`SELECT * FROM consents WHERE id = ${id} LIMIT 1`;
  const row = rows[0];
  if (!row) return NextResponse.json({ error: "missing" }, { status: 404 });

  const locale: Locale = row.locale === "en" ? "en" : "es";
  const pdf = await buildConsentPdf({
    locale,
    fullName: String(row.full_name),
    dni: String(row.dni),
    birthDate: String(row.birth_date).slice(0, 10),
    address: String(row.address),
    phone: String(row.phone),
    email: String(row.email || ""),
    bodyZone,
    inkBrand,
    inkLot,
    inkExpiry,
    isMinor: Boolean(row.is_minor),
    legalRepName: String(row.legal_rep_name || ""),
    legalRepDni: String(row.legal_rep_dni || ""),
    signatureUser: String(row.signature_user),
    signatureRep: String(row.signature_rep || ""),
    createdAt: new Date(String(row.created_at)),
  });

  await db`
    UPDATE consents SET
      body_zone = ${bodyZone},
      ink_brand = ${inkBrand || null},
      ink_lot = ${inkLot || null},
      ink_expiry = ${inkExpiry || null},
      pdf_base64 = ${Buffer.from(pdf).toString("base64")}
    WHERE id = ${id}
  `;

  return NextResponse.json({ ok: true });
}
