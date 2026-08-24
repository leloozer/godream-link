// Routage du lien de partage : envoie le visiteur vers SON store, en
// transportant le nom de canal pour que les installs soient attribuées.
//
// Repris de `thehiddenside-link`, avec une différence qui change le
// comportement : **aucun store n'est encore en ligne**. Les deux constantes
// ci-dessous sont donc vides, et tant qu'elles le sont la page n'affiche aucun
// bouton — elle dit que l'app arrive. Un bouton qui mène à une fiche
// inexistante est la pire première impression possible pour quelqu'un qui
// découvre l'app par un ami, et c'est la même règle que dans l'app elle-même
// (voir `AppLinks.storeUrl` : `null` plutôt qu'une URL morte).
//
// Fichier partagé par `index.html` et `404.html` : un seul endroit à modifier.
(function () {
  // ── À remplir au moment de la publication ────────────────────────────────
  // `APP_STORE_ID` : App Store Connect → Général → Informations sur l'app →
  // « Apple ID ». `PLAY_PACKAGE` est déjà connu, mais reste vide jusqu'à ce que
  // la fiche soit réellement en ligne : le connaître ne veut pas dire qu'elle
  // existe.
  var APP_STORE_ID = '';
  var PLAY_PACKAGE = '';

  // Provider token Apple, issu du générateur de liens de campagne (App Store
  // Connect → App Analytics). Sans lui, Apple ignore le nom de campagne `ct` et
  // les installs iOS ne sont pas ventilées par canal.
  var APPLE_PT = '';

  // `?s=` identifie la surface d'où vient le partage (`celebration`,
  // `achievement`, `reddit`…) — le même que celui posé par `AppLinks.shareLink`
  // dans l'app. Filtré et tronqué : la valeur vient de l'URL, part dans un lien,
  // et Apple limite `ct` à 40 caractères.
  var source = (new URLSearchParams(location.search).get('s') || 'share')
    .replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || 'share';

  var ios = '';
  if (APP_STORE_ID) {
    // Forme `/app/apple-store/id…` : celle que produit le générateur d'Apple
    // pour les liens de campagne.
    ios = 'https://apps.apple.com/app/apple-store/id' + APP_STORE_ID;
    if (APPLE_PT) {
      ios += '?pt=' + encodeURIComponent(APPLE_PT) +
             '&ct=' + encodeURIComponent(source) + '&mt=8';
    }
  }

  var play = '';
  if (PLAY_PACKAGE) {
    // Le `referrer` de Google Play doit contenir une chaîne utm elle-même
    // encodée.
    play = 'https://play.google.com/store/apps/details?id=' + PLAY_PACKAGE +
      '&referrer=' + encodeURIComponent(
        'utm_source=' + source + '&utm_medium=app&utm_campaign=share');
  }

  var iosLink = document.getElementById('ios');
  var playLink = document.getElementById('play');
  var soon = document.getElementById('soon');

  if (iosLink) { if (ios) iosLink.href = ios; else iosLink.hidden = true; }
  if (playLink) { if (play) playLink.href = play; else playLink.hidden = true; }
  // Le message d'attente n'apparaît que si vraiment aucun store n'est joignable.
  if (soon) soon.hidden = !!(ios || play);

  var ua = navigator.userAgent || '';
  var platform = /iPhone|iPad|iPod/i.test(ua) ? 'ios'
    : /Android/i.test(ua) ? 'android'
    : 'desktop';

  var target = platform === 'ios' ? ios : platform === 'android' ? play : '';

  // Envoi de la mesure AVANT la redirection.
  //
  // `sendBeacon` n'est pas une optimisation, c'est la seule façon d'y arriver :
  // un `location.replace` immédiat annule les requêtes en vol, donc un `capture`
  // normal serait perdu précisément sur les visiteurs qui comptent — ceux qu'on
  // redirige. Le beacon est remis au système et part même si la page disparaît
  // dans la milliseconde.
  //
  // Le try/catch est indispensable : un bloqueur peut faire échouer l'appel, et
  // aucun problème de mesure ne doit empêcher quelqu'un d'arriver sur le store.
  try {
    if (window.posthog && window.posthog.capture) {
      window.posthog.capture('smartlink_opened', {
        // Le même `s` que le `?s=` posé par l'app, que le `ct` d'Apple et que
        // l'`utm_source` de Google : les rapports des stores et PostHog parlent
        // enfin de la même chose.
        s: source,
        platform: platform,
        // `waiting` est le cas d'aujourd'hui : la page a été ouverte alors
        // qu'aucun store n'existe. Le compter à part est ce qui permettra de
        // dire, au lancement, combien de clics ont été perdus avant l'ouverture
        // des fiches — et donc si le partage valait d'être activé si tôt.
        sent_to: target ? 'store' : (platform === 'desktop' ? 'choice' : 'waiting'),
        referrer: document.referrer || undefined
      }, { transport: 'sendBeacon' });
    }
  } catch (e) { /* la mesure ne doit jamais bloquer une redirection */ }

  // `replace` et non `href` : le bouton retour du destinataire ne reste pas
  // piégé sur cette page.
  if (target) location.replace(target);

  // Ordinateur, ou aucun store : on ne devine pas, les boutons disponibles
  // restent affichés. C'est la seule page où le visiteur tranche lui-même, donc
  // la seule mesure honnête de la préférence de plateforme.
  var tapped = function (store) {
    return function () {
      try {
        if (window.posthog && window.posthog.capture) {
          window.posthog.capture('smartlink_store_tapped',
            { s: source, store: store, platform: platform },
            { transport: 'sendBeacon' });
        }
      } catch (e) { /* ignore */ }
    };
  };
  if (iosLink) iosLink.addEventListener('click', tapped('ios'));
  if (playLink) playLink.addEventListener('click', tapped('play'));
})();
