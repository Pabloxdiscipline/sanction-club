CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  ville TEXT NOT NULL,
  date TIMESTAMPTZ,
  max_participants INTEGER NOT NULL DEFAULT 40,
  whatsapp_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS registrations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id),
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  -- Nullable : optionnels pour type = 'interesse', obligatoires en application
  -- pour type = 'participant' (voir api/register.js).
  instagram TEXT,
  telephone TEXT,
  email TEXT NOT NULL,
  -- Optionnel : la participation reste valide meme case decochee, false par defaut.
  consentement_image BOOLEAN NOT NULL DEFAULT false,
  statut TEXT NOT NULL DEFAULT 'CONFIRME' CHECK (statut IN ('CONFIRME', 'WAITLIST', 'ANNULE', 'PRESENT')),
  type TEXT NOT NULL DEFAULT 'participant' CHECK (type IN ('participant', 'interesse')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, email),
  UNIQUE (event_id, instagram)
);

CREATE INDEX IF NOT EXISTS registrations_event_statut_idx ON registrations (event_id, statut);
