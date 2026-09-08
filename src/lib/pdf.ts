import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { STUDIO } from "./studio";
import { legalPlainText, type Locale } from "./legal";

export async function buildConsentPdf(data: {
  locale: Locale;
  fullName: string;
  dni: string;
  birthDate: string;
  address: string;
  phone: string;
  email: string;
  bodyZone: string;
  inkBrand: string;
  inkLot: string;
  inkExpiry: string;
  isMinor: boolean;
  legalRepName: string;
  legalRepDni: string;
  signatureUser: string;
  signatureRep: string;
  createdAt: Date;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([595, 842]);
  const black = rgb(0.08, 0.08, 0.09);
  let y = 810;

  const write = (text: string, size = 10, b = false) => {
    const f = b ? bold : font;
    const lines = wrap(text, 90);
    for (const line of lines) {
      if (y < 60) {
        page = doc.addPage([595, 842]);
        y = 810;
      }
      page.drawText(line, { x: 40, y, size, font: f, color: black });
      y -= size + 4;
    }
  };

  write("CONSENTIMIENTO INFORMADO — TATUAJE", 14, true);
  write(STUDIO.legalRef, 8);
  y -= 6;
  write(`Centro: ${STUDIO.name} · Tel. ${STUDIO.phone} · ${STUDIO.email}`, 10);
  write(`Aplicador: ${STUDIO.applicatorName} · ${STUDIO.applicatorDni}`, 10);
  write(STUDIO.qualification, 9);
  y -= 6;
  write(`Usuario: ${data.fullName} · DNI/NIE: ${data.dni}`, 10);
  write(`Nacimiento: ${data.birthDate} · Tel: ${data.phone} · Email: ${data.email || "—"}`, 10);
  write(`Dirección: ${data.address}`, 10);
  write(`Técnica: ${STUDIO.technique} · Zona: ${data.bodyZone}`, 10);
  write(
    `Materiales — marca: ${data.inkBrand || "—"} · lote: ${data.inkLot || "—"} · caducidad: ${data.inkExpiry || "—"}`,
    10
  );
  if (data.isMinor) {
    write(`Representante legal: ${data.legalRepName} · ${data.legalRepDni}`, 10);
  }
  write(`Lugar y fecha: estudio · ${data.createdAt.toISOString()}`, 10);
  y -= 8;
  write(legalPlainText(data.locale), 9);

  const embedPng = async (b64: string) => {
    const raw = b64.replace(/^data:image\/png;base64,/, "");
    const bytes = Buffer.from(raw, "base64");
    return doc.embedPng(bytes);
  };

  if (y < 180) {
    page = doc.addPage([595, 842]);
    y = 810;
  }
  y -= 10;
  write("Firma de la persona usuaria:", 10, true);
  try {
    const img = await embedPng(data.signatureUser);
    const w = 180;
    const h = (img.height / img.width) * w;
    page.drawImage(img, { x: 40, y: y - h, width: w, height: h });
    y -= h + 16;
  } catch {
    write("(firma adjunta)", 9);
  }
  if (data.signatureRep) {
    write("Firma del representante legal:", 10, true);
    try {
      const img = await embedPng(data.signatureRep);
      const w = 180;
      const h = (img.height / img.width) * w;
      page.drawImage(img, { x: 40, y: y - h, width: w, height: h });
    } catch {
      write("(firma adjunta)", 9);
    }
  }

  return doc.save();
}

function wrap(text: string, max: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(" ")) {
      const next = line ? `${line} ${word}` : word;
      if (next.length > max) {
        if (line) out.push(line);
        line = word;
      } else line = next;
    }
    out.push(line || " ");
  }
  return out;
}
