export type Locale = "es" | "en";

export type LegalSection = { id: string; title: string; body: string };

const ES: LegalSection[] = [
  {
    id: "antes",
    title: "5. Medidas a observar antes de la intervención",
    body: "La persona usuaria declara haber sido informada de que no debe: ingerir alcohol ni drogas previamente; acudir en ayunas; tomar, salvo criterio médico, fármacos anticoagulantes, antiagregantes o vasodilatadores; y que no debe exponerse al sol ni rayos UVA en la zona a tratar antes del procedimiento. Además, debe informar de enfermedades o alergias previas que puedan desaconsejar la técnica.",
  },
  {
    id: "higiene",
    title: "6. Medidas higiénico-sanitarias durante la técnica",
    body: "La técnica se realizará garantizando las medidas higiénico-sanitarias obligatorias: uso de material estéril o de un solo uso, limpieza y desinfección del área de trabajo, eliminación del material sobrante, uso de guantes, mascarilla, ropa de trabajo exclusiva y barreras de protección adicionales si procede.",
  },
  {
    id: "riesgos",
    title: "7. Contraindicaciones, riesgos y posibles complicaciones",
    body: "Esta técnica no debe realizarse durante embarazo, lactancia, en personas inmunodeprimidas, con enfermedades cutáneas activas o condiciones que dificulten la cicatrización. Entre las posibles complicaciones se incluyen: infecciones, reacciones alérgicas, sangrado, inflamación, cicatrices, queloides, granulomas, difusión del pigmento, o pérdida parcial del diseño. El tatuaje tiene carácter permanente, y su eliminación total no está garantizada.",
  },
  {
    id: "cuidados",
    title: "8. Cuidados posteriores",
    body: "La persona usuaria deberá seguir las siguientes indicaciones: mantener la zona limpia, lavado suave con agua tibia y jabón neutro, secado con papel de un solo uso, no rascar ni arrancar costras, evitar exposición solar, rayos UVA, piscinas, saunas y ropa ajustada. Aplicar una crema hidratante o cicatrizante adecuada (no irritante y sin perfumes). Estas pautas deben seguirse hasta la cicatrización completa.",
  },
  {
    id: "negativa",
    title: "9. Posibilidad de negativa",
    body: "La persona aplicadora podrá negarse a realizar la técnica si no existe consentimiento informado, o si la persona usuaria no se encuentra en condiciones físicas o psíquicas adecuadas.",
  },
  {
    id: "consentimiento",
    title: "11. Consentimiento expreso",
    body: "Declaro que he recibido información suficiente, entiendo los riesgos, complicaciones y cuidados posteriores, y presto mi consentimiento para la realización de la técnica descrita (tatuaje) en la zona anatómica indicada.",
  },
  {
    id: "rgpd",
    title: "12. Protección de datos",
    body: "De conformidad con la Ley Orgánica 3/2018 y el Reglamento (UE) 2016/679 (RGPD), se informa de que los datos recogidos se utilizarán únicamente para custodiar este consentimiento. El responsable es el propio establecimiento, que conservará este documento durante al menos 5 años. La persona usuaria puede ejercer sus derechos de acceso, rectificación, supresión, oposición, portabilidad y limitación del tratamiento dirigiéndose al centro.",
  },
];

const EN: LegalSection[] = [
  {
    id: "antes",
    title: "5. Measures before the procedure",
    body: "You confirm you have been informed not to: consume alcohol or drugs beforehand; attend fasting; take anticoagulant, antiplatelet or vasodilator medication unless medically indicated; or expose the area to sun or UVA before the procedure. You must disclose any illness or allergy that may advise against tattooing.",
  },
  {
    id: "higiene",
    title: "6. Hygiene during the procedure",
    body: "The procedure will be performed with mandatory hygiene measures: sterile or single-use materials, cleaning and disinfection of the work area, disposal of leftover material, gloves, mask, dedicated work clothing and additional barriers if needed.",
  },
  {
    id: "riesgos",
    title: "7. Contraindications, risks and possible complications",
    body: "This technique must not be performed during pregnancy or breastfeeding, in immunosuppressed people, with active skin disease, or conditions that impair healing. Possible complications include: infection, allergic reaction, bleeding, inflammation, scarring, keloids, granulomas, pigment spread or partial loss of the design. Tattoos are permanent; complete removal is not guaranteed.",
  },
  {
    id: "cuidados",
    title: "8. Aftercare",
    body: "Keep the area clean. Wash gently with lukewarm water and mild soap. Dry with single-use paper. Do not scratch or pick scabs. Avoid sun, UVA, swimming pools, saunas and tight clothing. Apply a non-irritating, fragrance-free moisturiser or healing cream until fully healed.",
  },
  {
    id: "negativa",
    title: "9. Right to refuse",
    body: "The practitioner may refuse the procedure if there is no informed consent, or if you are not in adequate physical or mental condition.",
  },
  {
    id: "consentimiento",
    title: "11. Express consent",
    body: "I declare that I have received sufficient information, I understand the risks, complications and aftercare, and I give my consent for the tattoo described on the indicated body area.",
  },
  {
    id: "rgpd",
    title: "12. Data protection",
    body: "Under Spanish Organic Law 3/2018 and EU GDPR 2016/679, data are used only to keep this consent on file. The studio is the controller and will retain this document for at least 5 years. You may exercise access, rectification, erasure, objection, portability and restriction rights by contacting the studio.",
  },
];

export function legalSections(locale: Locale): LegalSection[] {
  return locale === "en" ? EN : ES;
}

export function legalPlainText(locale: Locale): string {
  return legalSections(locale)
    .map((s) => `${s.title}\n${s.body}`)
    .join("\n\n");
}
