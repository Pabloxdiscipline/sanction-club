-- A n'executer que si `db/schema.sql` a deja ete applique une premiere fois
-- (table `registrations` existante). Sur une base jamais migree, le
-- schema.sql a jour (avec ajoute_whatsapp) suffit.

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS ajoute_whatsapp BOOLEAN NOT NULL DEFAULT false;
