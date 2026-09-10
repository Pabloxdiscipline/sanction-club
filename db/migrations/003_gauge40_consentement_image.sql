-- A n'executer que si `db/schema.sql` a deja ete applique une premiere fois
-- (table `registrations`/`events` existantes). Sur une base jamais migree,
-- le schema.sql a jour (max_participants par defaut 40, colonne
-- consentement_image) suffit.

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS consentement_image BOOLEAN NOT NULL DEFAULT false;

-- Fait passer la jauge existante de 30 a 40 places.
UPDATE events SET max_participants = 40 WHERE slug = 'sanction-club-paris-001';
