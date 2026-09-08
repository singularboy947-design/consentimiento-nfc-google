# Consentimiento NFC + reseña Google

App para **JOSE ANTONIO FERNÁNDEZ TATTOO**. El cliente toca la tarjeta NFC, rellena el consentimiento (ES/EN), firma, acepta el texto legal y queda guardado. A las **2 horas** se envía el recordatorio de reseña desde `singularboy947@gmail.com`.

- Formulario: `/`
- Panel: `/admin`
- Tarjeta 3D: `disenos/stl/singularboy-credito-vertical/`

## Gmail: no hace falta API de Google ni espera de verificación

Para **enviar** el mail no uses Google Cloud / Gmail API. Eso sí tarda.

Hoy, en 2 minutos:

1. Entra en [Google Account → Seguridad](https://myaccount.google.com/security) con `singularboy947@gmail.com`.
2. Activa **verificación en 2 pasos**.
3. [Contraseñas de aplicaciones](https://myaccount.google.com/apppasswords) → genera una para «Correo».
4. Pégala en Vercel como `GMAIL_APP_PASSWORD` (16 caracteres, sin espacios).

Eso es SMTP. Funciona el mismo día.

Google **no dice** quién publicó una reseña sin la API de Business Profile (eso sí puede tardar). El panel muestra:

- mail enviado
- mail abierto (píxel; iPhone a veces lo bloquea)
- **clic en el enlace de reseña** (lo más fiable)

## Vercel (proyecto nuevo)

1. [vercel.com](https://vercel.com) → Add New → Project → importa `singularboy947-design/consentimiento-nfc-google`.
2. Root: `.` (la raíz del repo).
3. Variables (todas):

| Variable | Valor |
|---|---|
| `DATABASE_URL` | Connection string de Neon (pooled, con `sslmode=require`) |
| `DASHBOARD_PASSWORD` | contraseña del panel (la eliges tú) |
| `CRON_SECRET` | cadena larga aleatoria |
| `GOOGLE_REVIEW_URL` | `https://g.page/r/8WegaqLuEK2LkdUP46GM-Aw/review` |
| `GMAIL_USER` | `singularboy947@gmail.com` |
| `GMAIL_APP_PASSWORD` | la de 16 caracteres |
| `APP_URL` | opcional: Vercel la infiere. Cuando tengas la URL, pégala aquí y también en GitHub Secrets para el cron |

4. Storage → Neon → Create Database **o** crea Neon a mano y pega `DATABASE_URL`.
5. En Neon → SQL Editor → pega y ejecuta [`sql/schema.sql`](sql/schema.sql).

Un cron cada 15 min en `vercel.json` **hace fallar el deploy en Hobby**. El mail a las 2 h lo dispara GitHub Actions (`Review reminders`). Secrets del repo: `APP_URL` y `CRON_SECRET`. Alternativa: [cron-job.org](https://cron-job.org) cada 15 min a:

`https://TU-APP.vercel.app/api/cron/review-reminders?secret=CRON_SECRET`

## NFC

Cuando Vercel dé la URL, graba el chip con [NFC Tools](https://www.wakdev.com/en/apps/nfc-tools.html):

`https://TU-APP.vercel.app`

## Impresión AD5X

```
disenos/stl/singularboy-credito-vertical/
  01_cuerpo.stl     negro
  02_acento.stl     amarillo (estrellas + G + mira del pozo)
  PAUSA_NFC.txt     capa 5 (1,00 mm, mitad)
```

54 × 85,6 × **2,0 mm**, vertical. G en el centro, 5 estrellas encima. Pozo Ø32 / mira Ø25 / pegatina Timeskey Ø25 **bajo la G**. Agrupar, no Reparar. Regenerar: `cd disenos && python3 generar_tarjeta_credito.py`
