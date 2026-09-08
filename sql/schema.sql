-- Consentimientos NFC · Neon Postgres
-- Pégalo en el SQL Editor de Neon y ejecuta.

CREATE TABLE IF NOT EXISTS consents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token           TEXT UNIQUE NOT NULL,
  locale          TEXT NOT NULL DEFAULT 'es',
  full_name       TEXT NOT NULL,
  dni             TEXT NOT NULL,
  birth_date      DATE NOT NULL,
  address         TEXT NOT NULL,
  phone           TEXT NOT NULL,
  email           TEXT,
  body_zone       TEXT NOT NULL,
  ink_brand       TEXT,
  ink_lot         TEXT,
  ink_expiry      TEXT,
  is_minor        BOOLEAN NOT NULL DEFAULT FALSE,
  legal_rep_name  TEXT,
  legal_rep_dni   TEXT,
  signature_user  TEXT NOT NULL,
  signature_rep   TEXT,
  legal_accepted  BOOLEAN NOT NULL DEFAULT FALSE,
  legal_version   TEXT NOT NULL,
  pdf_base64      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  review_email_at TIMESTAMPTZ NOT NULL,
  review_sent_at  TIMESTAMPTZ,
  email_opened_at TIMESTAMPTZ,
  review_clicked_at TIMESTAMPTZ,
  ip              TEXT
);

CREATE INDEX IF NOT EXISTS consents_created_at_idx ON consents (created_at DESC);
CREATE INDEX IF NOT EXISTS consents_review_due_idx ON consents (review_email_at)
  WHERE review_sent_at IS NULL AND email IS NOT NULL;
