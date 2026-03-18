import { chromium } from 'playwright';

async function discoverScoopCategories(page: any): Promise<string[]> {
    await page.goto('https://www.scoop.com.tn', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Extract all category links from the navigation menu
    const urls = await page.$$eval('a[href*="/"]', (links: any[]) =>
        links
            .map(link => link.href)
            .filter(href =>
                href.includes('scoop.com.tn') &&
                href.match(/\/\d+-/) && // matches pattern like /321-ordinateurs-portables
                !href.includes('.html') && // exclude product pages
                !href.includes('?') // exclude filtered pages
            )
    );

    // Remove duplicates
    const uniqueUrls = [...new Set(urls)] as string[];
    console.log(`Found ${uniqueUrls.length} categories`);
    return uniqueUrls;
}

async function scrapeScoopPage(page: any, url: string) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    let previousCount = 0;
    while (true) {
        const currentCount = await page.$$eval(
            '.tvproduct-catalog-wrapper',
            (items: any[]) => items.length
        );

        if (currentCount === previousCount) {
            console.log(`No more products loading on ${url}`);
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

    // Auto-discover all categories
    const categoryUrls = await discoverScoopCategories(page);

    const allProducts = [];

    for (const url of categoryUrls) {
        console.log(`\nScraping category: ${url}`);
        try {
            const products = await scrapeScoopPage(page, url);
            allProducts.push(...products);
        } catch (err) {
            console.error(`Failed to scrape ${url}:`, err);
            // Continue with next category even if one fails
        }
    }

    console.log(`\nTotal Scoop products: ${allProducts.length}`);
    await browser.close();
    return allProducts;
}