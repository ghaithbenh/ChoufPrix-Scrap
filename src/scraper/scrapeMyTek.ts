import { chromium } from 'playwright';

async function discoverMyTekCategories(page: any): Promise<string[]> {
    await page.goto('https://www.mytek.tn', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const urls = await page.$$eval('a[href]', (links: any[]) =>
        links
            .map(link => link.href)
            .filter(href =>
                href.includes('mytek.tn') &&
                !href.includes('myteksearch') && // exclude search pages
                !href.includes('.html') && // exclude product pages
                !href.includes('?') && // exclude filtered pages
                href.match(/mytek\.tn\/[a-z]/) // must be a category path
            )
    );

    const uniqueUrls = [...new Set(urls)] as string[];
    console.log(`Found ${uniqueUrls.length} categories on MyTek`);
    return uniqueUrls;
}

async function scrapeMyTekCategory(page: any, categoryUrl: string) {
    const allProducts = [];
    let currentPage = 1;

    while (true) {
        const url = `${categoryUrl}?p=${currentPage}`;
        console.log(`Scraping page ${currentPage}: ${url}`);

        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        const products = await page.$$eval('.product-container', (items: any[]) =>
            items.map(item => ({
                name: item.querySelector('.product-item-link')?.textContent?.trim() ?? '',
                price: Number(item.querySelector('.final-price')?.textContent?.replace(/[^0-9]/g, '')),
                url: item.querySelector('.product-item-link')?.getAttribute('href') ?? '',
                image: item.querySelector('img')?.getAttribute('src') ?? '',
                description: item.querySelector('.search-short-description')?.textContent?.trim() ?? '',
                store: 'MyTek'
            }))
        );

        if (products.length === 0) {
            console.log(`No more products on page ${currentPage}, moving to next category`);
            break;
        }

        console.log(`Found ${products.length} products on page ${currentPage}`);
        allProducts.push(...products);
        currentPage++;
        await page.waitForTimeout(1000);
    }

    return allProducts;
}

export async function scrapeMyTek() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    // Auto-discover all categories
    const categoryUrls = await discoverMyTekCategories(page);

    const allProducts = [];

    for (const url of categoryUrls) {
        console.log(`\nScraping category: ${url}`);
        try {
            const products = await scrapeMyTekCategory(page, url);
            allProducts.push(...products);
            console.log(`Category total: ${products.length} products`);
        } catch (err) {
            console.error(`Failed to scrape ${url}:`, err);
        }
    }

    console.log(`\nTotal MyTek products: ${allProducts.length}`);
    await browser.close();
    return allProducts;
}