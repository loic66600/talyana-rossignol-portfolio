# Optimisation des médias — 16 octobre 2026

## Changements

15 photographies sont fournies en AVIF, avec repli WebP et plusieurs tailles choisies par le navigateur via picture, srcset et sizes. Les cadrages CSS et les images originales sont conservés. La visionneuse télécharge l’original seulement à l’ouverture.

Le portrait principal est prioritaire et son préchargement AVIF utilise exactement les mêmes candidats et tailles que l’image. Son animation d’entrée ne retarde plus son apparition par une opacité initiale nulle. La transition au défilement reste inchangée.

Les autres images utilisent loading=lazy, decoding=async et une priorité basse. Les deux calques des coulisses partagent les mêmes candidats et tailles. Les affiches vidéo sont chargées à l’approche du lecteur ; les vidéos gardent preload=none et les contrôles natifs. Sans JavaScript, les vidéos restent lisibles avec leurs contrôles, sans affiche préalable.

Les six polices sont converties en WOFF2 avec caractères latins, accents, ponctuation et flèches. Les deux polices principales sont préchargées. Les nouveaux fichiers ont un nom contenant une empreinte de contenu et un cache Vercel d’un an. Les fichiers historiques restent disponibles pour les liens existants.

## Mesures de fichiers, pas un nouveau score Lighthouse

Pour les douze ressources du rapport fourni, comparaison avec les candidats adaptés aux dimensions CSS indiquées, en écran 1× : 1 284 422 octets avant ; 167 601 octets après, soit environ −87 %. Un écran haute densité sélectionne des variantes plus grandes ; le choix exact dépend du navigateur et de sa mémoire cache.

Polices : 433 572 octets au total avant ; 103 092 après, soit environ −76 %.

Exemples en AVIF : coulisses 480 px = 34 890 octets contre 316 238 pour l’original ; portrait 640 px = 15 954 contre 70 724. Ce sont des mesures locales de fichiers, pas des mesures de transfert réseau ou de LCP.

Toutes les variantes ont été décodées et leurs dimensions comparées aux descripteurs srcset. Les chemins locaux, le préchargement, l’absence d’image anticipée dans la visionneuse et le report des posters ont été contrôlés. La syntaxe JavaScript passe. La connexion au navigateur de contrôle a échoué ; aucun nouveau score Lighthouse ou Core Web Vitals n’est revendiqué.

## Reproduction

Le script scripts/optimize-media.py génère les variantes et docs/media-manifest.json à partir des originaux. Il utilise Pillow, fonttools et brotli uniquement en développement. Les chemins produits sont intégrés au HTML et au CSS ; si les sources changent, mettre à jour ces références à partir du manifeste. Aucun paquet Python n’est nécessaire sur Vercel.

Après publication, relancer Lighthouse sur la même URL, avec le même appareil et les mêmes réglages réseau/CPU, dans une nouvelle navigation avec cache vidé. Comparer surtout LCP, poids des images, requêtes de polices et stabilité de mise en page, puis ouvrir une photographie et lire une vidéo.
