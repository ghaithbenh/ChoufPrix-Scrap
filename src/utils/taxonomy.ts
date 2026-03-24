export interface CategoryMapping {
    parent: string;
    subcategory: string;
}

export const PARENT_CATEGORIES = [
    'Informatique',
    'Téléphonie',
    'Gaming',
    'Impression',
    'Réseau',
    'Audio & Vidéo',
    'Sécurité',
    'Bureautique',
    'Électroménager & Autres',
] as const;

export type ParentCategory = typeof PARENT_CATEGORIES[number];

/** Full two-level taxonomy tree */
export const TAXONOMY: Record<ParentCategory, string[]> = {
    'Informatique': [
        'PC Portable',
        'PC de Bureau',
        'Tablette',
        'Écran',
        'Clavier & Souris',
        'Stockage',
        'Composants',
    ],
    'Téléphonie': [
        'Smartphone',
        'Accessoires Téléphone',
        'Montre Connectée',
    ],
    'Gaming': [
        'PC Gamer',
        'Consoles',
        'Accessoires Gaming',
        'Chaises Gamer',
    ],
    'Impression': [
        'Imprimante',
        'Scanner',
        'Consommables',
    ],
    'Réseau': [
        'Routeur',
        'Switch',
        'Câbles Réseau',
    ],
    'Audio & Vidéo': [
        'Casque & Écouteurs',
        'Enceintes',
        'Télévision',
        'Vidéoprojecteur',
    ],
    'Sécurité': [
        'Caméra de Surveillance',
        "Système d'Alarme",
        "Contrôle d'Accès",
    ],
    'Bureautique': [
        'Papier',
        'Logiciels',
        'Fournitures',
    ],
    'Électroménager & Autres': [
        'Soin & Beauté',
        'Bijouterie',
        'Divers',
    ],
};

/** Fallback for unmapped categories */
const FALLBACK: CategoryMapping = { parent: 'Électroménager & Autres', subcategory: 'Divers' };

/**
 * Keyword rules — order matters: more specific rules first.
 * Each entry maps a set of keywords to a CategoryMapping.
 * The normalised input string is checked for inclusion of each keyword.
 */
const KEYWORD_RULES: Array<{ keywords: string[]; mapping: CategoryMapping }> = [
    // ── Gaming (before Informatique so "pc gamer" wins over "pc") ───────────
    {
        keywords: ['pc gamer', 'ordinateur gamer', 'gaming pc', 'gamer pc'],
        mapping: { parent: 'Gaming', subcategory: 'PC Gamer' },
    },
    {
        keywords: ['chaise gamer', 'fauteuil gamer', 'siege gamer', 'gamer chair'],
        mapping: { parent: 'Gaming', subcategory: 'Chaises Gamer' },
    },
    {
        keywords: [
            'console', 'ps5', 'ps4', 'playstation', 'xbox', 'nintendo', 'switch console',
            'jeux video', 'jeux-video', 'video game',
        ],
        mapping: { parent: 'Gaming', subcategory: 'Consoles' },
    },
    {
        keywords: [
            'manette', 'joystick', 'volant gaming', 'casque gaming', 'clavier gaming',
            'souris gaming', 'tapis gaming', 'tapis souris', 'accessoire gaming', 'accessoires gaming',
            'peripherique gaming',
        ],
        mapping: { parent: 'Gaming', subcategory: 'Accessoires Gaming' },
    },

    // ── Informatique ────────────────────────────────────────────────────────
    {
        keywords: [
            'ordinateur portable', 'ordinateurs portables', 'laptop', 'notebook', 'ultrabook',
            'pc portable', 'macbook', 'chromebook', 'netbook', 'ordinateur-portable',
            'pc-portable', 'ultraportable', 'computeur portable',
        ],
        mapping: { parent: 'Informatique', subcategory: 'PC Portable' },
    },
    {
        keywords: [
            'pc de bureau', 'pc bureau', 'ordinateur de bureau', 'ordinateurs de bureau',
            'desktop', 'unite centrale', 'workstation', 'station de travail',
            'all in one', 'all-in-one', 'tout en un', 'tout-en-un', 'aio',
            'mini pc', 'nuc',
        ],
        mapping: { parent: 'Informatique', subcategory: 'PC de Bureau' },
    },
    {
        keywords: ['tablette', 'tablet', 'ipad', 'tablette-tactile', 'tablette tactile', 'liseuse'],
        mapping: { parent: 'Informatique', subcategory: 'Tablette' },
    },
    {
        keywords: [
            'ecran', 'moniteur', 'monitor', 'display', 'ecran pc', 'ecran ordinateur',
            'ecran-pc', 'ecran plat', 'dalle', 'ecran 4k', 'ecran gaming', 'ecran led',
            'ecran lcd', 'ecran ips',
        ],
        mapping: { parent: 'Informatique', subcategory: 'Écran' },
    },
    {
        keywords: [
            'clavier souris', 'clavier-souris', 'clavier et souris', 'pack clavier',
            'clavier', 'souris', 'peripherique', 'peripheriques', 'webcam',
            'pavé numerique', 'pave numerique', 'pointeur', 'trackpad',
        ],
        mapping: { parent: 'Informatique', subcategory: 'Clavier & Souris' },
    },
    {
        keywords: [
            'stockage', 'disque dur', 'disque-dur', 'ssd', 'hdd', 'nvme', 'cle usb',
            'cle-usb', 'carte memoire', 'carte-memoire', 'nas', 'lecteur optique',
            'graveur', 'lecteur carte', 'flash', 'usb drive', 'pen drive',
        ],
        mapping: { parent: 'Informatique', subcategory: 'Stockage' },
    },
    {
        keywords: [
            'composant', 'composants', 'carte graphique', 'gpu', 'processeur', 'cpu',
            'ram', 'memoire ram', 'barrette ram', 'carte mere', 'carte-mere',
            'alimentation pc', 'boitier pc', 'refroidissement', 'ventilateur',
            'watercooling', 'radiateur', 'ventirad', 'carte reseau', 'carte son',
            'pate thermique', 'dissipateur',
        ],
        mapping: { parent: 'Informatique', subcategory: 'Composants' },
    },

    // ── Téléphonie ──────────────────────────────────────────────────────────
    {
        keywords: [
            'smartphone', 'telephone portable', 'telephone-portable', 'mobile', 'iphone',
            'android', 'gsm', 'smartphone-mobile', 'smartphone mobile', 'telephone mobile',
            'telephone-mobile', 'huawei', 'samsung galaxy', 'xiaomi', 'realme', 'oppo',
        ],
        mapping: { parent: 'Téléphonie', subcategory: 'Smartphone' },
    },
    {
        keywords: [
            'montre connectee', 'montre-connectee', 'smartwatch', 'bracelet connecte',
            'bracelet-connecte', 'montre intelligente',
        ],
        mapping: { parent: 'Téléphonie', subcategory: 'Montre Connectée' },
    },
    {
        keywords: [
            'accessoire telephone', 'accessoires telephone', 'accessoire-telephone',
            'accessoires-telephone', 'coque', 'protection ecran', 'verre trempe',
            'chargeur telephone', 'chargeur portable', 'cable telephone', 'batterie externe',
            'powerbank', 'power bank', 'station de charge', 'chargeur sans fil',
            'support telephone', 'selfie stick',
        ],
        mapping: { parent: 'Téléphonie', subcategory: 'Accessoires Téléphone' },
    },

    // ── Impression ──────────────────────────────────────────────────────────
    {
        keywords: [
            'scanner', 'numeriseur', 'numerisation',
        ],
        mapping: { parent: 'Impression', subcategory: 'Scanner' },
    },
    {
        keywords: [
            'cartouche', 'toner', 'encre', 'ruban', 'tambour', 'consommable',
            'consommables', 'recharge encre', 'papier photo',
        ],
        mapping: { parent: 'Impression', subcategory: 'Consommables' },
    },
    {
        keywords: [
            'imprimante', 'printer', 'impression', 'photocopieur', 'copieur',
            'multifonction', 'traceur', 'plotter',
        ],
        mapping: { parent: 'Impression', subcategory: 'Imprimante' },
    },

    // ── Réseau ──────────────────────────────────────────────────────────────
    {
        keywords: [
            'cable reseau', 'cable-reseau', 'rj45', 'cable ethernet', 'fibre optique',
            'patch cord', 'patch panel', 'connectique reseau',
        ],
        mapping: { parent: 'Réseau', subcategory: 'Câbles Réseau' },
    },
    {
        keywords: [
            'switch reseau', 'switch-reseau', 'hub reseau', 'hub ethernet', 'commutateur',
        ],
        mapping: { parent: 'Réseau', subcategory: 'Switch' },
    },
    {
        keywords: [
            'routeur', 'router', 'modem', 'box internet', 'point acces', 'point-acces',
            'access point', 'wifi', 'wi-fi', 'antenne wifi', 'repeteur wifi',
            'reseau', 'networking', 'ethernet', 'lan', 'wan', 'vpn',
        ],
        mapping: { parent: 'Réseau', subcategory: 'Routeur' },
    },

    // ── Audio & Vidéo ────────────────────────────────────────────────────────
    {
        keywords: [
            'casque', 'ecouteur', 'ecouteurs', 'airpod', 'airpods', 'headphone',
            'earphone', 'earbuds', 'casque audio', 'casque micro', 'casque bluetooth',
            'casque sans fil', 'intra auriculaire', 'over ear',
        ],
        mapping: { parent: 'Audio & Vidéo', subcategory: 'Casque & Écouteurs' },
    },
    {
        keywords: [
            'enceinte', 'haut parleur', 'haut-parleur', 'barre de son', 'soundbar',
            'speaker', 'home cinema', 'home-cinema', 'colonne de son',
        ],
        mapping: { parent: 'Audio & Vidéo', subcategory: 'Enceintes' },
    },
    {
        keywords: [
            'videoprojecteur', 'video-projecteur', 'projecteur', 'videoprojection',
            'retroprojecteur', 'beamer',
        ],
        mapping: { parent: 'Audio & Vidéo', subcategory: 'Vidéoprojecteur' },
    },
    {
        keywords: [
            'televiseur', 'television', 'tele', 'tv', 'smart tv', 'led tv',
            'oled', 'qled', 'uhd', '4k tv', '8k', 'televiseur 4k', 'ecran tv',
            'tv 4k', 'tv led',
        ],
        mapping: { parent: 'Audio & Vidéo', subcategory: 'Télévision' },
    },

    // ── Sécurité ─────────────────────────────────────────────────────────────
    {
        keywords: [
            'controle acces', 'controle-acces', 'badge', 'pointeuse', 'biometrique',
            'lecteur empreinte', 'turnstile', 'porte automatique',
        ],
        mapping: { parent: 'Sécurité', subcategory: "Contrôle d'Accès" },
    },
    {
        keywords: [
            'alarme', 'systeme alarme', 'systeme-alarme', 'detecteur', 'detecteur fumee',
            'detecteur mouvement', 'sirene', 'centrale alarme',
        ],
        mapping: { parent: 'Sécurité', subcategory: "Système d'Alarme" },
    },
    {
        keywords: [
            'camera surveillance', 'camera-surveillance', 'camera securite', 'ip cam',
            'ipcam', 'cctv', 'videosurveillance', 'video surveillance',
            'camera ip', 'dome camera', 'nvr', 'dvr', 'enregistreur video',
        ],
        mapping: { parent: 'Sécurité', subcategory: 'Caméra de Surveillance' },
    },

    // ── Bureautique ──────────────────────────────────────────────────────────
    {
        keywords: [
            'papier', 'rame papier', 'papier a4', 'papier imprimante', 'papier bureau',
        ],
        mapping: { parent: 'Bureautique', subcategory: 'Papier' },
    },
    {
        keywords: [
            'logiciel', 'software', 'antivirus', 'windows', 'microsoft office',
            'licence', 'abonnement logiciel', 'os', 'systeme exploitation',
        ],
        mapping: { parent: 'Bureautique', subcategory: 'Logiciels' },
    },
    {
        keywords: [
            'fourniture', 'stylo', 'agenda', 'calculatrice', 'lampe bureau',
            'lampe de bureau', 'bloc note', 'cahier', 'classeur', 'reliure',
            'destructeur', 'plastifieuse', 'ciseau', 'colle', 'scotch',
        ],
        mapping: { parent: 'Bureautique', subcategory: 'Fournitures' },
    },

    // ── Électroménager & Autres ──────────────────────────────────────────────
    {
        keywords: [
            'soin', 'beaute', 'rasoir', 'epilateur', 'seche cheveux', 'brosse a dents',
            'masseur', 'fer a lisser', 'lisseur', 'tondeuse', 'soin visage',
        ],
        mapping: { parent: 'Électroménager & Autres', subcategory: 'Soin & Beauté' },
    },
    {
        keywords: [
            'bijou', 'montre', 'bijouterie', 'collier', 'bracelet', 'bague', 'boucle oreille',
        ],
        mapping: { parent: 'Électroménager & Autres', subcategory: 'Bijouterie' },
    },
    {
        keywords: [
            'electromenager', 'refrigerateur', 'congelateur', 'machine laver',
            'machine a laver', 'climatiseur', 'clim', 'four', 'micro onde',
            'micro-onde', 'aspirateur', 'cafetiere', 'grille pain', 'fer repasser',
            'ventilateur', 'chauffage', 'radiateur electrique',
        ],
        mapping: { parent: 'Électroménager & Autres', subcategory: 'Divers' },
    },
];

/**
 * Normalise a raw category string:
 * – lowercase
 * – remove accents (NFD → strip combining chars)
 * – replace hyphens/underscores/multiple spaces with a single space
 * – trim
 */
function normalise(raw: string): string {
    return raw
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Map a raw scraped category string (URL slug or human-readable) to a
 * two-level { parent, subcategory } CategoryMapping.
 *
 * Algorithm:
 * 1. Normalise the input.
 * 2. Check each keyword rule in order (more specific rules are listed first).
 * 3. A rule matches when ANY of its keywords is found as a substring of the normalised input.
 * 4. Falls back to FALLBACK if nothing matches.
 */
export function mapCategory(rawCategory: string): CategoryMapping {
    if (!rawCategory) return FALLBACK;

    const normalised = normalise(rawCategory);

    for (const rule of KEYWORD_RULES) {
        if (rule.keywords.some(kw => normalised.includes(kw))) {
            return rule.mapping;
        }
    }

    return FALLBACK;
}
