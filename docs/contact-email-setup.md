# Activation du formulaire de Talyana Rossignol

Le code du formulaire et son API Vercel sont prêts. L’envoi direct reste désactivé jusqu’à la vérification du domaine d’expédition. Aucun e-mail réel n’a été envoyé pendant les tests.

Destinataire : rossignoltalyana12@gmail.com
Expéditeur prévu : Talyana Rossignol <portfolio@contact.lorn-digital-studio.fr>
Domaine Resend : contact.lorn-digital-studio.fr
Région : eu-west-1

Objet : Demande de [nom du client] — [société / projet si renseigné]. Le nom du client figure aussi dans le corps du message.

La vérification DNS a été lancée le 15 octobre 2026. Le dernier statut observé est pending. L’activation attend une validation effective.

## Entrées à ajouter dans la zone DNS lorn-digital-studio.fr

Utiliser TTL automatique ou la valeur par défaut. Les noms ci-dessous sont relatifs à lorn-digital-studio.fr. Si l’interface demande des noms complets, ajouter .lorn-digital-studio.fr à la fin. Ajouter ces entrées sans supprimer les enregistrements existants du domaine principal.

| Type | Nom | Valeur | Priorité |
| --- | --- | --- | --- |
| TXT | resend._domainkey.contact | p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDmhdgrTw4h60jGsjwQ4Q1Dq7zAtFDfTws++qYUlfeHk+7FHdlMWdcCCMUQ6RW7pRBK+WoIP6TNAehIOdECRJH9j7B2NC7I0jM+HSKNLWTnesALJ+K+pclI0NuTP7o1uSwQqWqLuHRYANNDLWe2W8DB2ibYiDYa7Q92jYxFc/ZudwIDAQAB | — |
| MX | send.contact | feedback-smtp.eu-west-1.amazonses.com | 10 |
| TXT | send.contact | v=spf1 include:amazonses.com ~all | — |
| CNAME | rsend.contact | send.forge.rmta.net | — |

## Finalisation après ajout des DNS

1. Lancer la vérification du domaine dans Resend et attendre son statut verified.
2. Passer CONTACT_FORM_ENABLED à true dans l’environnement production du projet Vercel talyana-rossignol-portfolio.
3. Redéployer le projet pour appliquer la variable.
4. Vérifier que GET /api/contact annonce available: true puis effectuer un envoi réel depuis le formulaire et vérifier sa réception.

La clé RESEND_API_KEY est déjà enregistrée comme secret côté serveur dans Vercel. Elle est limitée à l’envoi sur ce domaine. Elle ne figure ni dans ce dépôt ni dans les fichiers publics.

## Comportement et contrôles

Le formulaire Sites utilise également l’API du déploiement Vercel. Les origines autorisées sont définies dans api/contact.js. Le destinataire est fixé côté serveur. Le visiteur devient l’adresse Reply-To afin de lui répondre depuis la messagerie.

Validation côté serveur, champ piège, jeton signé, contrôle de délai, clé d’idempotence et limitation des tentatives par instance. La limitation en mémoire n’est pas un quota global distribué ; prévoir une règle WAF ou un limiteur partagé si le trafic devient important.

Le message reste dans le formulaire en cas d’erreur. Le lien d’envoi manuel et la copie du texte restent disponibles. Une confirmation de succès n’est affichée qu’après acceptation par le prestataire d’envoi ; elle ne garantit pas le placement en boîte de réception.

Vérifications : node --test tests/contact.test.js (9 tests avec prestataire simulé). Aucun envoi réel aux destinataires pendant ces tests.
