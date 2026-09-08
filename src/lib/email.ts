import nodemailer from "nodemailer";
import { STUDIO } from "./studio";

export function appUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function reviewUrl() {
  return process.env.GOOGLE_REVIEW_URL || "https://g.page/r/8WegaqLuEK2LkdUP46GM-Aw/review";
}

function transporter() {
  const user = process.env.GMAIL_USER || STUDIO.senderGmail;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!pass) throw new Error("Falta GMAIL_APP_PASSWORD");
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user, pass },
  });
}

export async function sendReviewReminder(opts: {
  to: string;
  name: string;
  locale: "es" | "en";
  token: string;
}) {
  const user = process.env.GMAIL_USER || STUDIO.senderGmail;
  const base = appUrl();
  const link = `${base}/r/${opts.token}`;
  const pixel = `${base}/api/track/open?t=${encodeURIComponent(opts.token)}`;
  const es = opts.locale !== "en";
  const subject = es
    ? "¿Nos dejas una reseña en Google?"
    : "Would you leave us a Google review?";
  const html = es
    ? `<p>Hola ${opts.name},</p>
<p>Gracias por tatuarte en <strong>${STUDIO.name}</strong>. Si te ha gustado el trabajo, nos ayudas muchísimo con una reseña en Google (toca el botón):</p>
<p><a href="${link}" style="display:inline-block;background:#141416;color:#E2B43A;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">Dejar reseña ★★★★★</a></p>
<p>Un saludo,<br>${STUDIO.applicatorName}</p>
<img src="${pixel}" width="1" height="1" alt="" />`
    : `<p>Hi ${opts.name},</p>
<p>Thanks for getting tattooed at <strong>${STUDIO.name}</strong>. A Google review helps us a lot:</p>
<p><a href="${link}" style="display:inline-block;background:#141416;color:#E2B43A;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">Leave a review ★★★★★</a></p>
<p>Cheers,<br>${STUDIO.applicatorName}</p>
<img src="${pixel}" width="1" height="1" alt="" />`;

  await transporter().sendMail({
    from: `"${STUDIO.name}" <${user}>`,
    to: opts.to,
    subject,
    html,
  });
}
