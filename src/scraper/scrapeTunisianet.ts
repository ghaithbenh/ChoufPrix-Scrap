import { chromium } from 'playwright';

export async function scrapeTunisianet() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    const allProducts = [];
    const totalPages = 34;

    for (let i = 1; i <= totalPages; i++) {
        console.log(`Scraping page ${i}/${totalPages}...`);

        await page.goto(
            `https://www.tunisianet.com.tn/702-ordinateur-portable?page=${i}&order=product.price.asc`,
            { waitUntil: 'domcontentloaded' }
        );

        await page.waitForTimeout(3000);

        const products = await page.$$eval('.item-product', (items: any[]) =>
            items.map(item => ({
                name: item.querySelector('.product-title a')?.textContent?.trim() ?? '',
                price: Number(item.querySelector('.price')?.textContent?.replace(/[^0-9]/g, '')),
                url: item.querySelector('.product-thumbnail')?.getAttribute('href') ?? '',
                image: item.querySelector('.center-block.img-responsive')?.getAttribute('src') ?? '',
                store: 'Tunisianet'
            }))
        );

        for (const product of products) {
            console.log(`✅ Scraped: ${product.name} - ${product.price} DT`);
        }

        console.log(`Found ${products.length} products on page ${i}`);
        allProducts.push(...products);
        await page.waitForTimeout(1000);
    }

    console.log(`Total Tunisianet products: ${allProducts.length}`);
    await browser.close();
    return allProducts;
}