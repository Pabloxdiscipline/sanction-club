# Runbook de déploiement

Le sandbox qui a écrit ce code n'a pas d'accès réseau sortant vers `vercel.com` /
`api.vercel.com` (politique d'egress de l'environnement), donc tout ce qui suit doit
être exécuté depuis ta machine.

## 1. Authentification Vercel

```bash
npm install -g vercel
vercel login
```

## 2. Lier le projet (nouveau projet, séparé de pxd-inscription)

Depuis le dossier `sanction-club` :

```bash
vercel link
```

Choisis "Create a new project" et nomme-le `sanction-club` (ne pas sélectionner le
projet existant de pxd-inscription).

## 3. Provisionner Vercel Postgres

Dashboard Vercel > projet `sanction-club` > onglet Storage > Create Database > Postgres.
Une fois créé, connecte-le au projet (Connect Project). Les variables `POSTGRES_URL` etc.
sont injectées automatiquement dans les Environment Variables du projet.

## 4. Variable ADMIN_PASSWORD

Dashboard Vercel > projet `sanction-club` > Settings > Environment Variables :
ajoute `ADMIN_PASSWORD` avec une valeur forte, pour les environnements Production et Preview.

## 5. Appliquer le schéma et le seed

```bash
vercel env pull .env.local
npm install
npm run migrate
```

Ou, alternative sans rien installer localement : ouvre l'onglet Query du dashboard
Vercel Postgres et colle le contenu de `db/schema.sql` puis `db/seed.sql`.

## 6. Déployer

```bash
vercel --prod
```

## 7. Domaine sanction.pabloxdiscipline.com

Dashboard Vercel > projet `sanction-club` > Settings > Domains > ajoute
`sanction.pabloxdiscipline.com`. Vercel affiche l'enregistrement DNS exact à créer
(en général un CNAME vers `cname.vercel-dns.com`, parfois accompagné d'un TXT de
vérification). Reproduis le même pattern que `seche.pabloxdiscipline.com` dans la
zone DNS Google Cloud (Cloud DNS) du domaine `pabloxdiscipline.com` :

```bash
gcloud dns record-sets create sanction.pabloxdiscipline.com. \
  --zone=<NOM_DE_LA_ZONE> \
  --type=CNAME \
  --ttl=300 \
  --rrdatas=cname.vercel-dns.com.
```

Ajoute l'enregistrement TXT de vérification affiché par Vercel de la même façon si
demandé (`--type=TXT --rrdatas="<valeur donnée par Vercel>"`).

## 8. Vérification post-déploiement

- Une inscription passe en `CONFIRME` tant que la jauge n'est pas pleine.
- Une deuxième inscription avec le même email ou le même Instagram renvoie
  "Tu es déjà inscrit au Sanction Club." (contrainte unique en base).
- Une fois `max_participants` atteint, les nouvelles inscriptions passent en `WAITLIST`.
- `/admin` affiche les bons compteurs, permet de changer un statut et d'exporter en CSV.

Pour tester rapidement l'effet de jauge sans attendre 30 vraies inscriptions, baisse
temporairement `max_participants` via une requête SQL dans le dashboard Postgres.
