# Contrat HTTP - TP1 et TP2

Base : `/api`. Sauf inscription et connexion, envoyer `Authorization: Bearer <token>`.

Le contrat HTTP ne dépend pas du choix de persistance : le backend fourni utilise Mongoose et MongoDB. MongoDB conserve les utilisateurs et métadonnées ; les octets des fichiers audio et des couvertures restent sur le disque du serveur.

| Méthode | Route | Requête | Réponse principale |
|---|---|---|---|
| GET | `/health` | - | `{ "status": "ok" }` |
| POST | `/auth/register` | `{name,email,password}` | `201 {token,user}` |
| POST | `/auth/login` | `{email,password}` | `200 {token,user}` |
| GET | `/users/me` | JWT | `200 User` |
| PUT | `/users/me` | `{name}` + JWT | `200 User` |
| GET | `/tracks?page=1&limit=5&search=blues` | JWT | `Page<Track>` filtrée facultativement par titre |
| POST | `/tracks` | multipart : `audio`, `title`, `cover` facultatif | `201 Track` |
| GET | `/tracks/:id/audio` | JWT | flux audio |
| GET | `/tracks/:id/cover` | JWT | image de couverture |
| DELETE | `/tracks/:id` | JWT | `204` (bonus) |

`Page<Track>` contient `items`, `page`, `limit`, `total` et `pages`. Le paramètre `search` est facultatif; s'il est fourni, la recherche partielle et insensible à la casse s'applique au titre avant la pagination. Sa longueur est limitée à 100 caractères.

L'upload audio utilise le champ multipart obligatoire `audio`, le champ texte `title` et le champ image facultatif `cover`. Formats audio acceptés : MP3, WAV, OGG et M4A, 25 Mo maximum. Formats de couverture acceptés : JPEG, PNG et WebP, 5 Mo maximum. Les réponses `Track` exposent `coverMimeType` (ou `null` si aucune couverture); elles n'exposent jamais le nom de fichier privé stocké sur le serveur. La route de couverture est authentifiée et réservée au propriétaire, comme la route audio. Supprimer une piste supprime aussi sa couverture éventuelle.

Erreurs courantes : `400` validation (fichier ou format incorrect), `401` authentification, `404` ressource ou couverture inconnue, `409` email déjà utilisé.
