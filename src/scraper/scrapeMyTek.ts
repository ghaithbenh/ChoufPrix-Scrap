import { chromium } from 'playwright';

export async function scrapeMyTek() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const allProducts = [];
    const totalPages = 22;

    for (let i = 1; i <= totalPages; i++) {
        console.log(`Scraping page ${i}/${totalPages}...`);

        await page.goto(
            `https://www.mytek.tn/myteksearch/index/productsearch/?q=pc&p=${i}`,
            { waitUntil: 'domcontentloaded' }
        );

        await page.waitForTimeout(3000);

        const products = await page.$$eval('.product-container', items =>
            items.map(item => ({
                name: item.querySelector('.product-item-link')?.textContent?.trim() ?? '',
                price: Number(item.querySelector('.final-price')?.textContent?.replace(/[^0-9]/g, '')),
                url: item.querySelector('.product-item-link')?.getAttribute('href') ?? '',
                image: item.querySelector('img')?.getAttribute('src') ?? '',
                description: item.querySelector('.search-short-description')?.textContent?.trim() ?? '',
                store: 'MyTek'
            }))
        );

        console.log(`Found ${products.length} products on page ${i}`);
        allProducts.push(...products);
        await page.waitForTimeout(1000);
    }

    await browser.close();
    return allProducts;
}