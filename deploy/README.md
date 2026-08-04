# Déploiement Portainer — proxy partagé pour renardeau + noisette

Un seul Caddy sur le serveur route le trafic vers les deux apps selon le nom de
domaine (FQDN). Ni renardeau ni noisette n'exposent de port sur l'hôte : tout
passe par le réseau Docker partagé `shared-proxy`.

```
Internet ──80/443──▶ [stack proxy: Caddy] ──▶ shared-proxy (réseau Docker)
                                                  ├── renardeau_app:3000
                                                  └── noisette_app:3000
```

## Fichiers

- `proxy/docker-compose.yml` + `proxy/Caddyfile` — le reverse-proxy unique
- `renardeau/docker-compose.yml` — stack renardeau (db + app), sans caddy
- `noisette/docker-compose.yml` — stack noisette (db + app), sans caddy

## Étape 0 — créer le réseau partagé (une seule fois, en SSH sur le serveur)

```bash
docker network create shared-proxy
```

Ce réseau doit exister **avant** de déployer la moindre stack, car les trois
stacks le référencent en `external: true`.

## Étape 1 — déployer la stack `proxy`

Dans Portainer → Stacks → Add stack :

- Nom : `proxy`
- Repository Git (recommandé, pour que le `Caddyfile` monté en volume suive
  le dépôt) **ou** collage direct du contenu de `proxy/docker-compose.yml` ;
  dans ce dernier cas, colle aussi le contenu de `Caddyfile` dans un fichier
  du même nom à côté, ou remplace le montage par un `Caddyfile` créé
  manuellement sur le serveur (`/opt/proxy/Caddyfile`).
- Variables d'environnement :
  - `RENARDEAU_DOMAIN=renardeau.tondomaine.com`
  - `NOISETTE_DOMAIN=noisette.tondomaine.com`

Déploie. Caddy démarre, écoute sur 80/443, mais ne peut pas encore
proxy-passer (les containers `renardeau_app` / `noisette_app` n'existent pas
encore) — c'est normal à ce stade.

## Étape 2 — déployer la stack `renardeau`

- Colle `renardeau/docker-compose.yml`
- Variables :
  - `DB_PASSWORD=...` (mot de passe Postgres renardeau)
  - `SESSION_SECRET=...` (chaîne aléatoire longue)
  - `GITHUB_USERNAME=...` (pour tirer `ghcr.io/<user>/renardeau:latest`)
  - `MY_DOMAIN=renardeau.tondomaine.com`
- Déploie. Vérifie que `renardeau_app` et `renardeau_db_prod` sont "healthy"
  dans Portainer.

## Étape 3 — déployer la stack `noisette`

- Colle `noisette/docker-compose.yml`
- Variables :
  - `DB_PASSWORD=...` (mot de passe Postgres **différent** de renardeau)
  - `SESSION_SECRET=...` (chaîne aléatoire longue, différente aussi)
  - `GITHUB_USERNAME=...`
  - `MY_DOMAIN=noisette.tondomaine.com`
- Déploie. Vérifie que `noisette_app` et `noisette_db_prod` sont "healthy".

## Étape 4 — DNS

Pour chaque domaine (`renardeau.tondomaine.com`, `noisette.tondomaine.com`),
crée un enregistrement DNS de type **A** pointant vers l'IP publique du
serveur. Caddy détecte automatiquement les nouveaux domaines via le
`Caddyfile` et génère les certificats HTTPS (Let's Encrypt) tout seul dès que
le DNS pointe correctement et que les ports 80/443 sont bien atteignables
depuis internet.

## Vérifications

```bash
# le réseau partagé existe et contient bien les 3 apps
docker network inspect shared-proxy

# logs du proxy si un domaine ne répond pas
docker logs shared_caddy -f

# la stack app est bien sur le bon réseau
docker inspect noisette_app | grep -A5 Networks
```

Si un domaine renvoie une erreur 502 : le service `app` correspondant n'est
probablement pas démarré ou pas encore sur le réseau `shared-proxy` —
redéploie la stack concernée.

Si le certificat HTTPS ne se génère pas : vérifie que le DNS pointe déjà vers
le serveur et que rien d'autre n'occupe les ports 80/443 sur l'hôte
(`docker ps`, `netstat -tlnp | grep -E ':80|:443'`).

## Pourquoi cette structure

- **Un seul Caddy** = un seul point de gestion TLS/certificats, pas de
  conflit de ports entre stacks.
- **`shared-proxy` en `external: true`** = chaque stack peut être déployée,
  redéployée ou supprimée indépendamment sans casser les autres, tant que le
  réseau externe existe.
- **`db` reste sur le réseau privé de chaque stack** (`renardeau-network` /
  `noisette-network`) uniquement — jamais exposée sur `shared-proxy`, donc
  jamais atteignable depuis l'autre app ni depuis l'extérieur.
