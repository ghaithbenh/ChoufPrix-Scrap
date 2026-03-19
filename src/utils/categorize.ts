export function categoryFromUrl(url: string): string {
    const slug = url.toLowerCase();

    const categories: { [key: string]: string[] } = {
        'Laptop': [
            'ordinateur-portable', 'laptop', 'notebook', 'ultrabook', 'pc-portable', 
            'macbook', 'chromebook'
        ],
        'Desktop': [
            'pc-de-bureau', 'desktop', 'unite-centrale', 'workstation', 'all-in-one', 
            'tout-en-un'
        ],
        'Smartphone': [
            'smartphone', 'telephone-portable', 'mobile', 'iphone', 'android'
        ],
        'Tablet': [
            'tablette', 'tablet', 'ipad'
        ],
        'Monitor': [
            'ecran', 'moniteur', 'display'
        ],
        'Gaming': [
            'gaming', 'console', 'ps5', 'xbox', 'nintendo', 'jeux-video'
        ],
        'Printer': [
            'imprimante', 'printer', 'scanner', 'photocopieur'
        ],
        'Storage': [
            'stockage', 'disque-dur', 'ssd', 'cle-usb', 'carte-memoire'
        ],
        'Components': [
            'composants', 'carte-graphique', 'processeur', 'ram', 'carte-mere', 
            'alimentation-pc', 'boitier-pc'
        ],
        'Peripherals': [
            'peripheriques', 'clavier', 'souris', 'manette', 'haut-parleur', 
            'casque-micro', 'webcam'
        ],
        'Networking': [
            'reseau', 'routeur', 'modem', 'switch', 'wifi'
        ],
        'TV & Video': [
            'televiseur', 'tv', 'home-cinema', 'videoprojecteur'
        ],
        'Camera': [
            'appareil-photo', 'camera', 'drones'
        ],
        'Appliances': [
            'electromenager', 'refrigerateur', 'machine-a-laver', 'climatiseur', 
            'four', 'micro-ondes'
        ]
    };

    for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => slug.includes(keyword))) {
            return category;
        }
    }

    return 'Other';
}
