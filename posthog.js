// Mesure de cette page : un comptage anonyme, envoyé directement à PostHog.
//
// ── Ce que la mesure apporte ────────────────────────────────────────────────
//
// Le maillon manquant de la boucle virale et des réseaux sociaux. L'app sait
// combien de pas sont partagés (`share_completed`) et combien de gens l'ouvrent
// (`app_opened`), mais entre les deux personne ne comptait les clics — ni ceux
// d'un partage, ni ceux d'un lien en bio Instagram ou TikTok (`?s=ig-bio`…).
// Sans ce chiffre, un partage qui ne convertit pas est indiscernable d'un
// partage que personne n'a cliqué — et ce sont deux problèmes opposés : le
// premier se corrige sur la fiche du store, le second sur le texte du partage.
//
// ── Pourquoi pas le SDK, et pourquoi pas de bannière ────────────────────────
//
// Le SDK se charge en asynchrone ; or la page redirige vers le store dans la
// milliseconde. Sur mobile, il n'a jamais le temps de s'exécuter : ses appels
// partent avec la page, c'est-à-dire nulle part. Un `sendBeacon` direct, lui,
// est remis au navigateur et part même si la page disparaît.
//
// Et ce n'est pas un traceur : ni cookie, ni stockage local, ni identifiant
// conservé, ni profil de personne (`$process_person_profile: false`). Un
// identifiant tiré au hasard à chaque événement, le canal, la plateforme, le
// domaine d'origine seul. Deux clics d'une même personne ne peuvent pas être
// reliés. C'est ce qui permet de compter sans bannière — un visiteur redirigé
// aussitôt n'aurait de toute façon jamais pu y répondre —, et c'est ce que dit
// la page de confidentialité. Pour que PostHog ne garde pas non plus l'adresse
// IP : activer « Discard client IP data » dans les réglages du projet.
//
// ── Comment les autres scripts s'en servent ─────────────────────────────────
//
// `smartlink.js` et `popularity.js` appellent `window.posthog.capture(…)` s'il
// existe. Ce fichier en fournit un, qui passe par le comptage anonyme : aucune
// ligne d'appel n'a eu à changer. Chargé AVANT eux (voir `index.html`).
//
// Projet PostHog : `GoDream` (298977, cloud UE), le même que l'app, pour que
// « partages → clics → installs → première action » se lise dans un seul projet.
(function () {
  // Clé de projet publique par nature : elle ne permet que d'écrire des
  // événements, jamais d'en lire. ⚠️ Cloud UE : une mauvaise région n'échoue
  // pas bruyamment, les événements partent et n'arrivent jamais.
  var KEY = 'phc_tJGNk7aM8JnHSvhm8nnQSRR2e9NeVdRbVtYtKF8JLWEi';
  var ENDPOINT = 'https://eu.i.posthog.com/i/v0/e/';

  var randomId = function () {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'v-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  };

  // Le domaine seul (instagram.com, l.tiktok.com…), jamais l'adresse complète.
  var hostOf = function (url) {
    try { return url ? new URL(url).hostname : undefined; } catch (e) { return undefined; }
  };

  // Ne lève jamais d'exception : un bloqueur de publicité peut refuser
  // l'envoi, et aucun problème de mesure ne doit empêcher quelqu'un d'arriver
  // sur le store.
  var count = function (event, props) {
    try {
      var properties = { $process_person_profile: false, $lib: 'smartlink' };
      for (var k in props) if (props[k] !== undefined) properties[k] = props[k];
      if (properties.referrer) properties.referrer = hostOf(properties.referrer);
      var body = JSON.stringify({
        api_key: KEY, event: event, distinct_id: randomId(),
        timestamp: new Date().toISOString(), properties: properties
      });
      // `text/plain` : seul type que `sendBeacon` envoie sans requête préalable
      // (CORS). PostHog lit le JSON quel que soit le type annoncé.
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' }))) return;
      // Repli : `keepalive` survit lui aussi à la navigation.
      fetch(ENDPOINT, { method: 'POST', body: body, keepalive: true, mode: 'no-cors', headers: { 'Content-Type': 'text/plain' } });
    } catch (e) { /* la mesure ne doit jamais bloquer une redirection */ }
  };

  // Le troisième argument des appelants (`{ transport: 'sendBeacon' }`) est
  // ignoré : l'envoi passe toujours par le beacon.
  window.posthog = { capture: function (event, props) { count(event, props); } };
})();
