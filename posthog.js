// Mesure de cette page — **inactive pour l'instant, et c'est délibéré.**
//
// Ce fichier existe vide plutôt que d'être absent : `index.html` le charge avant
// `smartlink.js`, et `smartlink.js` ne mesure que si `window.posthog` existe.
// Le laisser vide rend donc la page silencieuse sans qu'aucune ligne d'appel
// n'ait à changer le jour où on l'active.
//
// ── Pourquoi ce n'est pas encore branché ────────────────────────────────────
//
// Deux raisons, dans cet ordre.
//
// 1. **Il n'y a pas encore de projet PostHog.** `POSTHOG_KEY` est vide côté app
//    aussi (`lib/core/config.dart`), et `tool/build_release.sh` refuse de
//    builder une release sans. Mettre une clé bidon ici serait le placeholder en
//    production que tout ce dépôt s'interdit.
//
// 2. **Cette page est publique et hors de l'app.** Un traceur tiers sur une page
//    web accessible depuis l'UE demande un consentement préalable — donc une
//    bannière. L'app, elle, a son interrupteur de refus dans les Réglages, ce
//    qui est une autre situation juridique. Activer la mesure ici sans bannière
//    serait contredire la politique de confidentialité que ce même site publie
//    deux liens plus bas.
//
// ── Ce que la mesure apporterait ────────────────────────────────────────────
//
// Le maillon manquant de la boucle virale. L'app sait combien de pas sont
// partagés (`share_completed`) et combien de gens l'ouvrent (`app_opened`), mais
// entre les deux personne ne compte les clics. Sans ce chiffre, un partage qui
// ne convertit pas est indiscernable d'un partage que personne n'a cliqué — et
// ce sont deux problèmes opposés : le premier se corrige sur la fiche du store,
// le second sur le texte du partage.
//
// ── Pour l'activer ──────────────────────────────────────────────────────────
//
// 1. Créer le projet PostHog (cloud **UE** — l'app force déjà
//    `https://eu.i.posthog.com`, et un projet créé sur le cloud US reçoit des
//    événements qui n'apparaissent jamais).
// 2. Ajouter une bannière de consentement, et ne charger le SDK qu'après accord.
// 3. Remplacer ce fichier par l'extrait officiel du SDK web, avec la même clé de
//    projet que l'app : la page et l'app doivent vivre dans le même entonnoir,
//    sinon « partages → clics → installs → première action » ne se lit nulle
//    part.
//
// GitHub Pages ne fournit aucune statistique de trafic, donc il n'y a pas de
// solution de repli côté hébergeur. L'alternative sans traceur est Cloudflare
// Pages (gratuit, statistiques agrégées incluses, sans cookie).
