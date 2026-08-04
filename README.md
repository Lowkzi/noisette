# Noisette 🌰

Application de gestion des finances personnelles d'un foyer : comptes, dépenses & revenus,
budget, épargne, factures récurrentes et rapports. Basée sur les mêmes conventions techniques
que Renardeau (Next.js App Router, Prisma + PostgreSQL, Tailwind v4, JWT + cookies httpOnly),
mais un projet totalement indépendant (base de données et authentification propres, aucun lien
avec Renardeau).

## Stack

- Next.js 16 (App Router, TypeScript, `output: standalone`)
- Prisma 7 + PostgreSQL (adapter `@prisma/adapter-pg`)
- Tailwind CSS v4
- Authentification par session JWT (`jose`) + cookie httpOnly, mots de passe hachés avec `bcryptjs`
- Validation des formulaires avec `zod`

Note : pas de double authentification (MFA/TOTP) en V1, contrairement à Renardeau qui utilise
`otplib` — mot de passe + session suffisent pour ce cas d'usage. Voir le commentaire dans
`src/lib/session.ts`.

## Démarrage

1. Copier `.env.example` en `.env` et renseigner :
   - `DATABASE_URL` : connexion PostgreSQL, ex. `postgresql://user:password@localhost:5432/noisette`
   - `SESSION_SECRET` : chaîne aléatoire longue (ex. `openssl rand -base64 32`)
2. Installer les dépendances :
   ```
   npm install
   ```
3. Générer le client Prisma et appliquer le schéma :
   ```
   npx prisma generate
   npx prisma migrate dev --name init
   ```
4. Lancer le serveur de développement :
   ```
   npm run dev
   ```

## Modèle de données

- `Household` (foyer) : membres, comptes, catégories, transactions, budgets, objectifs
  d'épargne, factures récurrentes.
- `User` : email, mot de passe haché, rôle (`OWNER`/`MEMBER`), rattaché à un foyer.
- `Account` (compte) : courant, épargne, espèces, autre — solde courant mis à jour à chaque
  transaction.
- `Category` (catégorie) : dépense ou revenu.
- `Transaction` : montant, date, libellé, compte, catégorie, type (dépense/revenu/virement).
  Peut être marquée `isShared` avec des `TransactionSplit` (part due par chaque membre) pour
  calculer qui doit combien à qui.
- `Budget` : montant prévu par catégorie et par mois (toujours le 1er du mois), comparé aux
  transactions du mois pour suivre la consommation.
- `SavingsGoal` (objectif d'épargne) : montant cible, montant actuel, date cible optionnelle.
- `RecurringBill` (facture récurrente) : montant, jour d'échéance dans le mois, rappel avant
  échéance, affichée sur le tableau de bord.

## Déploiement (Docker)

`Dockerfile` et `docker-entrypoint.sh` sont modelés sur ceux de Renardeau : build multi-étapes
Next.js standalone, puis `prisma migrate deploy` exécuté au démarrage du conteneur avant de
lancer le serveur. Variables d'environnement requises à l'exécution : `DATABASE_URL`,
`SESSION_SECRET`.

## Ce qui n'est pas dans cette V1

- Pas de synchronisation bancaire : toute la saisie est manuelle (comme le CMG/Pajemploi dans
  Renardeau).
- Pas de MFA/TOTP.
- La répartition des dépenses partagées est volontairement simple : un montant par membre sur
  la transaction, pas de règles de partage automatiques (pourcentage, parts égales, etc.).
