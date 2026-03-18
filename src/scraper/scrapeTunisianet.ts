import { chromium } from 'playwright';

async function discoverTunisianetCategories(page: any): Promise<string[]> {
    await page.goto('https://www.tunisianet.com.tn', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const urls = await page.$$eval('a[href]', (links: any[]) =>
        links
            .map(link => link.href)
            .filter(href =>
                href.includes('tunisianet.com.tn') &&
                !href.includes('.html') &&
                !href.includes('?') &&
                href.match(/tunisianet\.com\.tn\/[a-z]/) &&
                !href.match(/tunisianet\.com\.tn\/$/) // exclude homepage
            )
    );

    const uniqueUrls = [...new Set(urls)] as string[];
    console.log(`Found ${uniqueUrls.length} categories on Tunisianet`);
    return uniqueUrls;
}

async function scrapeTunisianetCategory(page: any, categoryUrl: string) {
    const allProducts = [];
    let currentPage = 1;

    while (true) {
        const url = `${categoryUrl}?page=${currentPage}&order=product.price.asc`;
        console.log(`Scraping page ${currentPage}: ${url}`);

        await page.goto(url, { waitUntil: 'domcontentloaded' });
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

        if (products.length === 0) {
            console.log(`No more products on page ${currentPage}, moving to next category`);
            break;
        }

        for (const product of products) {
            console.log(`✅ Scraped: ${product.name} - ${product.price} DT`);
        }

        console.log(`Found ${products.length} products on page ${currentPage}`);
        allProducts.push(...products);
        currentPage++;
        await page.waitForTimeout(1000);
    }

    return allProducts;
}

export async function scrapeTunisianet() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // Auto-discover all categories
    const categoryUrls = await discoverTunisianetCategories(page);

    const allProducts = [];

    for (const url of categoryUrls) {
        console.log(`\nScraping category: ${url}`);
        try {
            const products = await scrapeTunisianetCategory(page, url);
            allProducts.push(...products);
            console.log(`Category total: ${products.length} products`);
        } catch (err) {
            console.error(`Failed to scrape ${url}:`, err);
        }
    }

    console.log(`\nTotal Tunisianet products: ${allProducts.length}`);
    await browser.close();
    return allProducts;
}