# Formulaire de Talyana Rossignol — Web3Forms

Depuis le 20 novembre 2026, le formulaire utilise Web3Forms directement dans le navigateur. Il n’appelle plus l’ancienne API Vercel/Resend et ne dépend plus de la validation du domaine Resend.

## Destinataire

La clé publique `access_key` fournie par le propriétaire est intégrée dans `dist/index.html`. Web3Forms envoie à l’adresse associée à cette clé dans son compte. Le code ne permet pas de lire ni de modifier cette adresse. La destination attendue est rossignoltalyana12@gmail.com : vérifier cette association dans Web3Forms et la réception d’un message réel.

## Envoi

Champs conservés : nom, société/projet, e-mail, message. L’objet contient le nom du client et sa société/projet si renseignée. Web3Forms utilise le champ `email` pour répondre au visiteur. Le nom du formulaire est « Portfolio Talyana Rossignol ».

Avec JavaScript, envoi JSON vers https://api.web3forms.com/submit, sans quitter la page. La confirmation exige une réponse HTTP valide et `success: true`. En cas d’erreur, les champs restent remplis et le lien mailto vers Talyana ainsi que la copie du message sont disponibles. Bouton désactivé pendant l’envoi, délai maximal de 18 secondes, champ piège botcheck.

Sans JavaScript, le formulaire effectue un POST HTML vers Web3Forms avec un objet générique. Le service affiche alors sa page de résultat.

## Validation

Les tests automatisés simulent les réponses du prestataire ; ils n’envoient pas d’e-mail réel. Après publication, envoyer un message clairement identifié comme test depuis le site puis vérifier sa réception et l’adresse de réponse dans la boîte de Talyana.

L’ancienne fonction `api/contact.js` et ses tests restent historiques. Ses variables Resend ne servent plus au formulaire actuel. Ne pas activer l’ancien circuit pour configurer Web3Forms.
