# godream-link — le site public de GoDream

Page statique hébergée sur GitHub Pages. Elle fait **deux** choses, et la
seconde est ce qui la rend obligatoire :

1. **Router un partage** vers le bon store (App Store sur iOS, Google Play sur
   Android, les deux boutons sur ordinateur), en transportant le canal pour que
   les installs soient attribuées — sans SDK, gratuitement.
2. **Publier la politique de confidentialité et les conditions à une URL
   publique.** Les deux stores la réclament en plus de la version lisible dans
   l'app. Sans elle, aucune fiche n'est acceptée.

Dépôt volontairement **séparé et public** : GitHub Pages sur un dépôt privé
demande un plan payant, et le code de l'app n'a pas à devenir public pour ça.
Même raison et même forme que `thehiddenside-link`, dont ce site reprend le
mécanisme de smart link.

- URL publique : `https://leloozer.github.io/godream-link/`
- **Aucun secret ici.** Ne rien ajouter d'autre que la page.

## Publier (une seule fois)

```sh
cd /home/doctreen/Perso/project/godream-link
git init && git add -A && git commit -m "le site public de GoDream"
git branch -M main
git remote add origin https://github.com/leloozer/godream-link.git
git push -u origin main
```

Puis dépôt → **Settings → Pages** → *Source* : « Deploy from a branch », branche
`main`, dossier `/ (root)` → *Save*. La mise en ligne prend une à deux minutes.

## Les textes légaux ne s'éditent pas ici

`confidentialite.html`, `privacy.html`, `conditions.html` et `terms.html` sont
**générés** depuis l'app :

```sh
cd ../godream && python3 tool/gen_legal_html.py
```

La source est `lib/features/settings/legal_screen.dart`. C'est délibéré : le même
texte existe en deux endroits — l'app et cette page — et `legal_screen.dart` dit
lui-même qu'« un écart entre les deux est un motif de retour en revue ». Recopier
à la main garantit l'écart, parce que personne ne pense au site en corrigeant une
phrase dans l'app.

Le script refuse de générer si le français et l'anglais n'ont pas le même nombre
de sections : une politique amputée d'un paragraphe dans une seule langue est
exactement ce qu'un examinateur relève.

Corriger un texte légal, donc : éditer le Dart, relancer le script, committer les
deux dépôts.

## Brancher dans l'app

`AppLinks.site` est vide par défaut, donc **l'app ne met aucun lien dans ses
partages** tant qu'on ne le renseigne pas. C'est voulu : un lien vers une page
qui n'existe pas est la pire première impression pour quelqu'un qui découvre
l'app par un ami.

```sh
flutter build appbundle \
  --dart-define=GODREAM_SITE_URL=https://leloozer.github.io/godream-link
```

`tool/build_release.sh` avertit si la variable est absente. Les liens produits :

| Surface du partage | Lien |
|---|---|
| Célébration après un pas | `…/?s=celebration` |
| Rêve accompli, dans le Profil | `…/?s=achievement` |

D'autres canaux hors app s'ajoutent à la main (`?s=reddit`, `?s=insta`…).

⚠️ **À décider avant d'activer.** Aucun store n'est encore en ligne : la page
affiche donc « GoDream arrive bientôt » au lieu de boutons. Renseigner
`GODREAM_SITE_URL` dès maintenant veut dire que les partages enverront les gens
sur cette page d'attente. C'est honnête, mais ça consomme une part de la
curiosité qu'on n'aura qu'une fois. L'alternative est de laisser la variable vide
jusqu'à la publication : les partages fonctionnent quand même, l'image circule,
il n'y a simplement pas de lien.

## Au moment de la publication

Trois constantes dans **`smartlink.js`**, et rien d'autre :

| Constante | Où la trouver |
|---|---|
| `PLAY_PACKAGE` | `com.godream.app` — à renseigner quand la fiche est **réellement en ligne**, pas quand elle est créée |
| `APP_STORE_ID` | App Store Connect → Général → Informations sur l'app → « Apple ID » |
| `APPLE_PT` | App Store Connect → App Analytics → générateur de liens de campagne |

Sans `APPLE_PT`, Apple ignore le nom de campagne et les installs iOS ne sont pas
ventilées par canal. Les boutons se masquent tout seuls tant que leur constante
est vide — il n'y a jamais de bouton qui mène nulle part.

## Attribution des installs

| Plateforme | Mécanisme | Où le lire |
|---|---|---|
| iOS | `?pt=<pt>&ct=<canal>&mt=8` | App Store Connect → App Analytics → campagnes |
| Android | `&referrer=utm_source=<canal>&…` | Play Console → acquisition |

Le canal vient du `?s=` de l'URL partagée, et c'est le **même** identifiant que
le `source` de `share_completed` côté app. Les rapports des stores et PostHog
parlent donc de la même chose. Apple limite `ct` à 40 caractères : la valeur est
filtrée et tronquée par le script.

## Mesure de la page

Inactive. `posthog.js` est vide, et ce fichier explique pourquoi : il n'y a pas
encore de projet PostHog, et une page publique hors app demande une bannière de
consentement que l'interrupteur des Réglages ne couvre pas.

## Mettre à jour l'aperçu

`preview.png` (1200×630, 48 Ko) est généré depuis la même géométrie que l'icône :

```sh
cd ../godream && python3 tool/brand/preview.py
```

Les messageries mettent l'aperçu en cache longtemps : après un remplacement,
changer aussi le **nom** du fichier (`preview-2.png`) dans les balises
`og:image`, sinon l'ancienne image continuera de s'afficher.
