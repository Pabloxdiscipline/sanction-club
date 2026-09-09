# Sanction Club

Landing page d'inscription pour Sanction Club (running + discipline, univers PabloXDiscipline).
Statique (HTML/CSS/JS, pas de build) + Vercel Serverless Functions + Vercel Postgres.

## Structure

```
index.html              Landing page (hero + formulaire + etats confirmation/waitlist)
app.js                   Logique front de la landing page
styles.css               Design tokens et styles (partages avec admin/)
admin/                   Espace admin protege par mot de passe
api/status.js            GET  jauge de places (public)
api/register.js          POST inscription (participant ou interesse)
api/admin/registrations.js  GET liste + PATCH statut (protege)
api/admin/export.js      GET  export CSV (protege)
db/schema.sql            Schema events + registrations
db/seed.sql              Insertion de l'evenement Sanction Club Paris #001
scripts/migrate.mjs      Applique schema.sql puis seed.sql via POSTGRES_URL
```

## Design tokens

`--noir #09090B` `--rouge #FF2F38` `--blanc #F5F4F0` `--gris #A7ABB4`.
Bebas Neue (titres) + Inter (corps), woff2 embarques localement, mêmes fichiers que `pxd-inscription`.

## Variables d'environnement (Vercel)

- `POSTGRES_URL` (et les autres `POSTGRES_*`) : injectees automatiquement en liant un store Vercel Postgres au projet.
- `ADMIN_PASSWORD` : mot de passe de l'espace `/admin`, a definir dans les Project Settings.

## Modele de donnees

Un seul evenement en V1, identifie par le slug fixe `sanction-club-paris-001` (voir `db/seed.sql`).
`max_participants` et `whatsapp_link` se modifient directement en base (dashboard Vercel Postgres,
onglet Query) : ce ne sont pas des valeurs codees en dur dans le front ou les fonctions API.

Voir `DEPLOY.md` pour le runbook complet (login Vercel, Postgres, migration, deploiement, DNS).
