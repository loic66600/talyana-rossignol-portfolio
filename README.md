# Talyana Rossignol — Portfolio éditorial

Site statique autonome, créé pour Sites. Tous les fichiers publics sont dans `dist/`.

## Contenu

`dist/index.html` contient les textes et les photographies du portfolio. `dist/styles.css` définit les compositions éditoriales et les adaptations mobiles. `dist/app.js` gère le header au scroll, la navigation, les filtres, la visionneuse, le carrousel vidéo et la préparation d’e-mails.

Les photos WebP sont issues des pièces jointes de l’utilisateur. Les références visuelles ne sont pas utilisées comme réalisations de Talyana. Les polices Bodoni Moda et Manrope sont servies localement. Les mentions administratives à compléter sont signalées dans la fenêtre des mentions légales.

## Fonctionnement

Le site reste statique et sans compilation. Le formulaire envoie directement à Web3Forms depuis le navigateur. Un envoi manuel par messagerie et une copie du texte restent disponibles en cas d’erreur. Voir `docs/contact-email-setup.md`. La préférence de réduction des animations désactive le header épinglé et les effets de mouvement.

## Publication

La configuration Sites se trouve dans `.openai/hosting.json`. La publication utilise `dist/`. Conserver l’identifiant du projet pour toute modification.

## Médias ajoutés le 15 octobre 2026

La galerie contient 14 photos, dont les nouvelles prises de vue `studio-shoot.webp`, `studio-hair.webp` et `backstage-work.webp`. Les cinq vidéos fournies sont dans `dist/assets/films/`, avec leurs affiches WebP. Les MP4 conservent les flux vidéo et audio originaux ; leur index est placé au début pour permettre la lecture progressive. Les lecteurs natifs utilisent `preload="none"`, sans lecture automatique. Le JavaScript met en pause les autres films au démarrage d’une vidéo, ainsi que les vidéos sorties de l’écran ou lors du passage à un autre onglet.

## Déploiement Vercel

Déployer la racine du dépôt avec `vercel.json` : les fichiers publics sont dans `dist/`. Le formulaire fonctionne directement sur Sites et Vercel avec Web3Forms. L’ancienne fonction `api/contact.js` est conservée comme code historique, mais n’est plus appelée par le formulaire.
