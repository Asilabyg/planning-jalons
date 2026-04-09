# planning-jalons

Site web simple pour suivre des jalons projet, mettre à jour leurs forecasts et visualiser les points de vigilance.

## Pages disponibles
- `/index.html` : page d'accueil avec objectifs et aperçu rapide.
- `/input.html` : formulaire de création / modification, filtres, tri et actions sur les jalons.
- `/visualisation.html` : indicateurs globaux, synthèses par catégorie et liste des jalons critiques.

## Données attendues
Le frontend consomme un backend HTTP configuré dans `script.js` via `API_URL`.

Chaque jalon contient principalement :
- `id`
- `nom`
- `area`
- `type`
- `pic`
- `planningDate`
- `currentForecast`
- `forecastHistory`
- `planning`

## Validation manuelle recommandée
- Ouvrir la page d'accueil et vérifier que les boutons de navigation sont visibles et lisibles.
- Charger la page de saisie et vérifier l'apparition des messages d'erreur si le formulaire est incomplet.
- Ajouter un jalon, modifier un jalon existant puis supprimer un jalon.
- Tester la recherche, les filtres et les tris dans le tableau.
- Ouvrir la page de visualisation et vérifier les KPI, les regroupements et la liste des jalons critiques.
- Couper le backend ou provoquer une erreur réseau pour vérifier les messages d'erreur et les états de chargement.
