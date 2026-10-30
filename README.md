# Guitar Practice Cloud — TP Angular 1, 2 et 3

Application web de bibliothèque audio réalisée dans le cadre des travaux
pratiques Angular du M1 MIAGE. Le frontend Angular communique avec une API
Express protégée par JWT; les métadonnées sont stockées dans MongoDB et les
fichiers audio/couvertures sur le serveur.

## Fonctionnalités

- **TP1 — Authentification et profil** : inscription, connexion, routes
  protégées, gestion de session et mise à jour du profil.
- **TP2 — Bibliothèque audio** : pagination, recherche, upload audio et
  couverture, lecture authentifiée.
- **TP3 — Fiabilisation** : suppression confirmée, progression de l’upload et
  tests automatisés du frontend.

## Technologies

- Frontend : Angular 22, TypeScript, Angular Material.
- Backend : Node.js, Express 5, Mongoose et MongoDB.
- Authentification : JSON Web Token (JWT).

## Prérequis

- Node.js 22 ou plus récent et npm ;
- Git ;
- MongoDB Atlas (ou une instance MongoDB configurée pour le backend) ;
- un navigateur récent.

## Démarrage en local

### 1. Configurer et démarrer l’API

Dans un terminal, depuis la racine du dépôt :

```bash
cd AngularM1_Miage_2026_2027_TP123-main/backend
cp .env.example .env
```

Renseignez `MONGODB_URI` et `JWT_SECRET` dans `backend/.env`, puis lancez :

```bash
npm install
npm start
```

L’API écoute par défaut sur `http://localhost:3000`. Son endpoint de santé est
`http://localhost:3000/api/health`.

### 2. Démarrer le frontend

Dans un second terminal, depuis la racine du dépôt :

```bash
cd AngularM1_Miage_2026_2027_TP123-main/frontend-starter
npm install
npm start
```

Ouvrez `http://localhost:4200`. Pour les essais locaux, le compte de
démonstration fourni est `demo@example.com` / `Demo1234!`.

## Tests et build

Depuis `frontend-starter` :

```bash
npm test
npm run build
```

Depuis `backend` :

```bash
npm test
```

Les tests frontend HTTP simulent les réponses avec `HttpTestingController`;
ils n’exigent pas de backend ni de base MongoDB en fonctionnement.

## Documentation du dépôt

Les dossiers et documents du projet se trouvent dans
[`AngularM1_Miage_2026_2027_TP123-main/`](./AngularM1_Miage_2026_2027_TP123-main/).

- [Guide détaillé du projet](./AngularM1_Miage_2026_2027_TP123-main/README.md)
- [Sujet TP1](./AngularM1_Miage_2026_2027_TP123-main/SUJET_ETUDIANT_TP1.md)
- [Sujet TP2](./AngularM1_Miage_2026_2027_TP123-main/SUJET_ETUDIANT_TP2.md)
- [Sujet TP3](./AngularM1_Miage_2026_2027_TP123-main/SUJET_ETUDIANT_TP3.md)
- [Contrat de l’API](./AngularM1_Miage_2026_2027_TP123-main/API_CONTRACT.md)
- [Rapport d’utilisation de l’IA](./AngularM1_Miage_2026_2027_TP123-main/RAPPORT_IA_MODELE.md)

## Sécurité

Ne versionnez jamais `backend/.env`. N’insérez pas d’URI MongoDB, de secret
JWT, de mot de passe ou de jeton dans le code frontend, les captures d’écran
ou le rapport.
