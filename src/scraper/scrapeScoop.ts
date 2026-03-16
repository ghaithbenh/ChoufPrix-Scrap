import { chromium } from 'playwright';

const SCOOP_URLS = [
    'https://www.scoop.com.tn/321-ordinateurs-portables',
    'https://www.scoop.com.tn/291-pc-de-bureau'
];

async function scrapeScoopPage(page: any, url: string) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    let previousCount = 0;
    while (true) {
        const currentCount = await page.$$eval('.tvproduct-catalog-wrapper', (items: any[]) => items.length);
        console.log(`Products loaded: ${currentCount}`);

        if (currentCount === previousCount) {
            console.log('No more products loading, done scrolling');
            break;
        }

        previousCount = currentCount;
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);
    }

    const products = await page.$$eval('.tvproduct-catalog-wrapper', (items: any[]) =>
        items.map(item => ({
            name: item.querySelector('.tvproduct-name')?.textContent?.trim() ?? '',
            price: Number(item.querySelector('.price')?.textContent?.replace(/[^0-9]/g, '')),
            url: item.querySelector('.product-thumbnail')?.getAttribute('href') ?? '',
            image: item.querySelector('.tvproduct-defult-img')?.getAttribute('src') ?? '',
            description: item.querySelector('.tv-product-desc')?.textContent?.trim() ?? '',
            store: 'Scoop'
        }))
    );

    for (const product of products) {
        console.log(`✅ Scraped: ${product.name} - ${product.price} DT`);
    }

    console.log(`Found ${products.length} products on ${url}`);
    return products;
}

export async function scrapeScoopTN() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    const allProducts = [];

    for (const url of SCOOP_URLS) {
        const products = await scrapeScoopPage(page, url);
        allProducts.push(...products);
    }

    console.log(`Total Scoop products: ${allProducts.length}`);
    await browser.close();
    return allProducts;
}