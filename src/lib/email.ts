import nodemailer from "nodemailer";
import { STUDIO } from "./studio";

export function appUrl() {
  const raw =
    process.env.APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "";
  if (!raw) return "http://localhost:3000";
  return raw.startsWith("http") ? raw.replace(/\/$/, "") : `https://${raw.replace(/\/$/, "")}`;
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

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName.trim();
}

function reviewMailCopy(locale: "es" | "en", name: string) {
  const who = escapeHtml(firstName(name));
  const studio = escapeHtml(STUDIO.name);
  const artist = escapeHtml(STUDIO.applicatorName);
  if (locale !== "en") {
    return {
      subject: `Gracias por confiar en mí, ${firstName(name)}`,
      preview: "Si te es amable, una reseña en Google me ayuda muchísimo.",
      greeting: `Hola ${who},`,
      body: `Gracias de verdad por confiar en mí y tatuarte en <strong style="color:#f4f1ea">${studio}</strong>. Ha sido un gusto tenerte en el estudio.`,
      ask: "Si te apetece y te es amable, una reseña en Google me ayuda muchísimo a que otras personas me encuentren.",
      cta: "Dejar reseña en Google ★★★★★",
      sign: `Un abrazo,<br>${artist}`,
    };
  }
  return {
    subject: `Thanks for trusting me, ${firstName(name)}`,
    preview: "If you'd be so kind, a Google review would help me a lot.",
    greeting: `Hi ${who},`,
    body: `Thank you so much for trusting me and getting tattooed at <strong style="color:#f4f1ea">${studio}</strong>. It was a pleasure to have you in the studio.`,
    ask: "If you'd be so kind as to leave a Google review, it would help me a lot so other people can find me.",
    cta: "Leave a Google review ★★★★★",
    sign: `Warmly,<br>${artist}`,
  };
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
  const copy = reviewMailCopy(opts.locale, opts.name);

  const html = `<!DOCTYPE html>
<html lang="${opts.locale}">
<body style="margin:0;padding:0;background:#0f0f10;font-family:Georgia,Times,serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${copy.preview}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f10;padding:28px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#17171a;border:1px solid #2a2a2e;border-radius:16px">
          <tr>
            <td style="padding:36px 28px 40px;color:#f4f1ea">
              <p style="margin:0 0 8px;color:#e2b43a;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;font-family:ui-sans-serif,system-ui,sans-serif">${escapeHtml(STUDIO.name)}</p>
              <p style="margin:0 0 18px;font-size:26px;line-height:1.25">${copy.greeting}</p>
              <p style="margin:0 0 14px;font-size:17px;line-height:1.55;color:#ddd8ce">${copy.body}</p>
              <p style="margin:0 0 28px;font-size:17px;line-height:1.55;color:#ddd8ce">${copy.ask}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:4px 0 22px">
                    <a href="${link}" style="display:block;width:100%;box-sizing:border-box;background:#e2b43a;color:#141416;text-decoration:none;font-weight:800;font-size:20px;line-height:1.2;padding:22px 18px;border-radius:14px;text-align:center;font-family:ui-sans-serif,system-ui,sans-serif">${copy.cta}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:16px;line-height:1.5;color:#9a9184">${copy.sign}</p>
              <img src="${pixel}" width="1" height="1" alt="" />
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter().sendMail({
    from: `"${STUDIO.applicatorName}" <${user}>`,
    to: opts.to,
    subject: copy.subject,
    html,
  });
}
