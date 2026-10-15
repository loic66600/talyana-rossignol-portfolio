# Talyana Rossignol — Portfolio éditorial

Site statique autonome, créé pour Sites. Tous les fichiers publics sont dans `dist/`.

## Contenu

`dist/index.html` contient les textes et les photographies du portfolio. `dist/styles.css` définit les compositions éditoriales et les adaptations mobiles. `dist/app.js` gère le header au scroll, la navigation, les filtres, la visionneuse, le carrousel vidéo et la préparation d’e-mails.

Les photos WebP sont issues des pièces jointes de l’utilisateur. Les références visuelles ne sont pas utilisées comme réalisations de Talyana. Les polices Bodoni Moda et Manrope sont servies localement. Les mentions administratives à compléter sont signalées dans la fenêtre des mentions légales.

## Fonctionnement

Le site reste statique et sans compilation. Le formulaire utilise une fonction Vercel dans `api/contact.js` et Resend lorsque le domaine d’expédition est vérifié et `CONTACT_FORM_ENABLED=true`. Un envoi manuel par messagerie et une copie du texte restent disponibles en cas d’indisponibilité. Les étapes d’activation et les DNS sont documentés dans `docs/contact-email-setup.md`. La préférence de réduction des animations désactive le header épinglé et les effets de mouvement.

## Publication

La configuration Sites se trouve dans `.openai/hosting.json`. La publication utilise `dist/`. Conserver l’identifiant du projet pour toute modification.

## Médias ajoutés le 15 octobre 2026

La galerie contient 14 photos, dont les nouvelles prises de vue `studio-shoot.webp`, `studio-hair.webp` et `backstage-work.webp`. Les cinq vidéos fournies sont dans `dist/assets/films/`, avec leurs affiches WebP. Les MP4 conservent les flux vidéo et audio originaux ; leur index est placé au début pour permettre la lecture progressive. Les lecteurs natifs utilisent `preload="none"`, sans lecture automatique. Le JavaScript met en pause les autres films au démarrage d’une vidéo, ainsi que les vidéos sorties de l’écran ou lors du passage à un autre onglet.

## Déploiement Vercel

Déployer la racine du dépôt avec `vercel.json` : les fichiers publics sont dans `dist/` et la fonction dans `api/`. La copie Vercel des métadonnées HTML utilise son domaine public. Le dossier `api/` ne fait pas partie de la publication statique Sites ; son formulaire appelle le même endpoint Vercel avec une liste CORS limitée.
