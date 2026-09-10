-- A n'executer que si `db/schema.sql` a deja ete applique une premiere fois
-- (table `registrations` existante). Sur une base jamais migree, le
-- schema.sql a jour (avec nom/telephone/instagram nullable) suffit.

ALTER TABLE registrations ADD COLUMN IF NOT EXISTS nom TEXT;
UPDATE registrations SET nom = '' WHERE nom IS NULL;
ALTER TABLE registrations ALTER COLUMN nom SET NOT NULL;

ALTER TABLE registrations ADD COLUMN IF NOT EXISTS telephone TEXT;

-- instagram devient optionnel (obligatoire uniquement en application pour
-- type = 'participant'), pour permettre les inscriptions "interesse" sans
-- Instagram renseigne.
ALTER TABLE registrations ALTER COLUMN instagram DROP NOT NULL;
