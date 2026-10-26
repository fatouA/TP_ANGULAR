# Rapport d'usage de l'IA - TP1

Pour chaque mission, détailler et fournir des explications concernant : objectif; prompt principal; plan proposé par l'agent; vérifications réalisées par le binôme; erreurs ou propositions rejetées; fichiers effectivement modifiés; preuve de fonctionnement; ce que chaque membre sait maintenant expliquer sans l'agent.

---

## Mission 0 — Cartographier l’application
* **Date** : 26 octobre 2026
* **Outil et modèle** : Copilot SDK dans VS Code — mai-code-1.1-flash, puis gpt-6-luna (changement de modèle en cours de session).
* **Objectif** : Cartographier le frontend Angular sans modifier le code : composant racine, routes, enregistrement de `HttpClient`, modèles, services et pages, ajout du JWT, routes publiques/protégées et flux du clic sur « Se connecter ».

### Prompts principaux
1. Demande de lire les consignes du projet et de réaliser la Mission 0 en lecture seule, sans renseigner le rapport à ce stade.
2. « Tu seras mon assistant de développement pour ce projet Angular [...] Travaille uniquement dans ce dossier. [...] On commence par la Mission 0 (cartographie, sans rien modifier) [...] Ne renseigne rien dans le rapport pour l'instant, travaillons étape par étape. »
3. « tu as renseigné quelque chose dans rapport ia modele ? »
4. « oui c'est bon, ajoute, et supprime ce qu'il y avait »

### Analyse réalisée
- Le bootstrap et l’enregistrement de `provideRouter(routes)` et `provideHttpClient(withInterceptors([authInterceptor]))` se trouvent dans `frontend-starter/src/main.ts`.
- Le composant racine est `AppComponent`, défini dans `frontend-starter/src/app/components/app/app.ts`. Son template `app.html` contient le `router-outlet`.
- Les routes sont définies dans `frontend-starter/src/app/routes.ts`. `login` et `register` sont sans `authGuard`; `profile` et `tracks` utilisent `authGuard`.
- Le formulaire de connexion appelle `AuthService.login()`. Le service effectue `POST /api/auth/login`; à la réponse, il conserve le token dans `localStorage` sous `gpc_token` et met à jour ses Signals `token` et `currentUser`. En cas de succès, la page navigue vers `/tracks`.
- `authGuard` vérifie la présence du token avant l’accès aux pages protégées. `authInterceptor`, enregistré au bootstrap, lit le token d’`AuthService` et ajoute l’en-tête d’authentification si un token est présent. L’API login est publique selon le contrat; l’intercepteur peut néanmoins ajouter un en-tête si un ancien token est encore présent.
- Les modèles sont `User`, `AuthResponse`, `Track` et `Page<T>`. Les services sont `AuthService` et `TrackService`. Les pages sont connexion, inscription, profil et pistes audio.

### Schéma annoté du flux au clic sur « Se connecter »
```text
Utilisateur
  └─ clique « Se connecter »
      └─ login-page.html : ngSubmit appelle submit()
          └─ login-page.ts : AuthService.login(email, password)
              └─ auth.service.ts : POST /api/auth/login
                  └─ auth.interceptor.ts : ajoute le JWT si un token est présent
                      └─ réponse { token, user }
                          └─ AuthService stocke le token et met à jour ses Signals
                              └─ subscribe.next() dans login-page.ts
                                  └─ navigation vers /tracks
                                      └─ authGuard vérifie le token
                                          └─ TracksPageComponent s’affiche
```

### Routes de l’API selon `API_CONTRACT.md`
- **Publiques** : `GET /api/health`, `POST /api/auth/register`, `POST /api/auth/login`.
- **Protégées par JWT** : `GET /api/users/me`, `PUT /api/users/me`, `GET /api/tracks?page=1&limit=5`, `POST /api/tracks`, `GET /api/tracks/:id/audio`, `DELETE /api/tracks/:id`.

### Fichiers consultés
- `README.md`
- `API_CONTRACT.md`
- `frontend-starter/AGENTS.md`
- `frontend-starter/best-practices.md`
- `frontend-starter/src/main.ts`
- `frontend-starter/src/app/routes.ts`
- `frontend-starter/src/app/components/app/app.ts`
- `frontend-starter/src/app/components/app/app.html`
- `frontend-starter/src/app/components/login-page/login-page.ts`
- `frontend-starter/src/app/components/login-page/login-page.html`
- `frontend-starter/src/app/shared/services/auth.service.ts`
- `frontend-starter/src/app/shared/services/track.service.ts`
- `frontend-starter/src/app/shared/interceptors/auth.interceptor.ts`
- `frontend-starter/src/app/shared/guards/auth.guard.ts`
- `frontend-starter/src/app/shared/models/user.model.ts`
- `frontend-starter/src/app/shared/models/auth-response.model.ts`
- `frontend-starter/src/app/shared/models/track.model.ts`
- `frontend-starter/src/app/shared/models/page.model.ts`

### Modifications acceptées ou refusées
- Mission 0 : aucune modification du code; cartographie uniquement.
- Rapport : l’ancienne entrée a été remplacée, car elle attribuait à tort un autre outil/modèle et mentionnait des validations, fichiers et détails qui n’avaient pas été consultés ou réalisés dans cette session.
- Aucun changement apporté à la section « Ce que j’ai compris ».

### Commandes lancées
- Aucune commande shell.

### Erreurs et résolutions
- Aucune erreur de commande ou de build; aucune commande n’a été lancée.


---

## Mission 1 — Inscription, connexion et profil
* **Date** : 26 octobre 2026
* **Outil et modèle** : Copilot SDK dans VS Code — gpt-6-luna.
* **Objectif** : Compléter les formulaires d’inscription et de connexion, la gestion locale de l’authentification, la déconnexion, le chargement et la modification du profil, ainsi que le traitement des réponses 401, sans modifier le contrat HTTP ni le backend.

### Prompts principaux
1. Demande d’analyser le code existant de la Mission 1, de proposer les changements et fichiers concernés, puis d’attendre la validation avant toute modification.
2. La Mission 1 demandait des formulaires réactifs et validés, les appels d’inscription/connexion, le stockage du JWT sans le journaliser, la mise à jour de `currentUser`, la déconnexion, le chargement et la modification du profil et le retour à `/login` si un token protégé est invalide ou expiré.
3. « c'est bon je valide »

### Plan proposé et suivi
1. Inspecter les pages et le service d’authentification côté Angular, l’intercepteur, la navigation, le contrat HTTP et les endpoints correspondants du backend.
2. Attendre l’approbation du périmètre avant toute édition.
3. Ajouter les validations et messages d’erreur dans les pages connexion, inscription et profil; conserver les appels HTTP dans `AuthService`.
4. Centraliser l’ajout du JWT et l’expiration de session dans l’intercepteur, ajouter le bouton de déconnexion et charger le profil à l’ouverture de sa page.
5. Lancer le build Angular et les tests disponibles.

### Fichiers consultés
- `API_CONTRACT.md`
- `frontend-starter/package.json`
- `frontend-starter/src/styles.css`
- `frontend-starter/src/app/routes.ts`
- `frontend-starter/src/app/components/app/app.ts`
- `frontend-starter/src/app/components/app/app.html`
- `frontend-starter/src/app/components/app/app.css`
- `frontend-starter/src/app/components/login-page/login-page.ts`
- `frontend-starter/src/app/components/login-page/login-page.html`
- `frontend-starter/src/app/components/login-page/login-page.css`
- `frontend-starter/src/app/components/register-page/register-page.ts`
- `frontend-starter/src/app/components/register-page/register-page.html`
- `frontend-starter/src/app/components/register-page/register-page.css`
- `frontend-starter/src/app/components/profile-page/profile-page.ts`
- `frontend-starter/src/app/components/profile-page/profile-page.html`
- `frontend-starter/src/app/components/profile-page/profile-page.css`
- `frontend-starter/src/app/shared/services/auth.service.ts`
- `frontend-starter/src/app/shared/interceptors/auth.interceptor.ts`
- `frontend-starter/src/app/shared/guards/auth.guard.ts`
- `backend/src/app.js`
- `backend/src/models/User.js`
- `RAPPORT_IA_MODELE.md`

### Modifications acceptées
- `frontend-starter/src/app/shared/interceptors/auth.interceptor.ts` : n’envoie le JWT qu’aux endpoints API protégés; exclut les endpoints publics; sur un `401` d’une requête ayant envoyé le JWT, nettoie la session et redirige vers `/login`. Les refus d’identifiants sur la route publique de connexion ne déclenchent donc pas la déconnexion.
- `frontend-starter/src/app/components/login-page/login-page.ts` et `login-page.html` : champs vides par défaut, validation visible, prévention des doubles soumissions, messages lisibles et journalisation limitée au statut d’erreur.
- `frontend-starter/src/app/components/register-page/register-page.ts` et `register-page.html` : validations du nom, de l’adresse e-mail et de la longueur minimale du mot de passe; messages adaptés, prévention des doubles soumissions et message spécifique pour une adresse déjà utilisée.
- `frontend-starter/src/app/components/profile-page/profile-page.ts` et `profile-page.html` : chargement automatique du profil à l’ouverture, états de chargement/réussite/erreur, validation du nom et mise à jour via `AuthService`.
- `frontend-starter/src/app/components/app/app.ts` et `app.html` : ajout du bouton de déconnexion qui nettoie l’état local et revient à `/login`.
- Aucun changement du backend, de `API_CONTRACT.md` ou de `AuthService`; les appels API et le stockage du JWT existaient déjà dans `AuthService`.

### Vérifications et commandes lancées
- `npm run build` : première tentative depuis le dossier parent du frontend, échouée car ce dossier ne contient pas `package.json`; relancée depuis `frontend-starter`, réussie.
- `npm run build` depuis `frontend-starter` après les changements : réussi (bundle Angular généré).
- `npm test` depuis `frontend-starter` : non exécuté jusqu’au bout, car l’environnement DOM requis par Angular est absent (`jsdom` ou `happy-dom` manquant). Aucun paquet n’a été ajouté.
- Recherche de fichiers `*.spec.ts` sous `frontend-starter/src` : aucun fichier de test correspondant trouvé.

### Erreurs et résolutions
- Mauvais répertoire de travail lors de la première commande de build : corrigé en relançant la commande depuis `frontend-starter`.
- Suite de tests indisponible faute d’environnement DOM; build de production réussi. La dépendance manquante n’a pas été installée afin de ne pas élargir le changement.

### Ce que j’ai compris (à rédiger par l’étudiante)
### Ce que j’ai compris

J’ai compris comment se déroule l’authentification dans l’application, de l’inscription à la connexion. Lorsqu’un utilisateur s’inscrit ou se connecte, Angular envoie une requête à l’API. Après une connexion réussie, le token JWT est enregistré dans le navigateur pour permettre l’accès aux pages protégées.

J’ai aussi compris que le JWT est envoyé lors des requêtes qui nécessitent une authentification. Enfin, le profil permet de récupérer les informations de l’utilisateur et de modifier son nom grâce au service d’authentification.
