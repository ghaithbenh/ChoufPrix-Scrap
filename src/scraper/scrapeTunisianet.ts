import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
import type { IProductInput } from '../models/product.js';
import { categoryFromUrl } from '../utils/categorize.js';
import { parallelLimit } from '../utils/concurrency.js';

async function setupPage(page: Page) {
    await page.route('**/*', route => {
        if (['image', 'stylesheet', 'font'].includes(route.request().resourceType())) {
            route.abort();
        } else {
            route.continue();
        }
    });
}

async function discoverTunisianetCategories(browser: Browser): Promise<string[]> {
    console.log('Discovering categories on Tunisianet...');
    const page = await browser.newPage();
    await setupPage(page);
    
    try {
        await page.goto('https://www.tunisianet.com.tn', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('a[href]', { timeout: 10000 });

        const urls = await page.$$eval('a[href]', (links: HTMLAnchorElement[]) =>
            links
                .map(link => link.href)
                .filter(href =>
                    href.includes('tunisianet.com.tn') &&
                    !href.includes('.html') &&
                    !href.includes('?') &&
                    href.match(/tunisianet\.com\.tn\/[0-9]+-[a-z]/) &&
                    !href.match(/tunisianet\.com\.tn\/$/)
                )
        );

        const uniqueUrls = [...new Set(urls)];
        console.log(`Found ${uniqueUrls.length} potential categories on Tunisianet`);
        return uniqueUrls;
    } finally {
        await page.close();
    }
}

async function scrapeTunisianetPage(browser: Browser, baseUrl: string, pageNum: number, category: string): Promise<IProductInput[]> {
    const page = await browser.newPage();
    await setupPage(page);
    const url = `${baseUrl}?page=${pageNum}&order=product.price.asc`;
    
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        try {
            await page.waitForSelector('.item-product', { timeout: 5000 });
        } catch {
            return []; // No products
        }

        const products = await page.$$eval('.item-product', (items: Element[]) =>
            items.map(item => ({
                name: item.querySelector('.product-title a')?.textContent?.trim() ?? '',
                price: Number(item.querySelector('.price')?.textContent?.replace(/[^0-9]/g, '')),
                url: item.querySelector('.product-title a')?.getAttribute('href') ?? '',
                image: item.querySelector('.product-thumbnail img')?.getAttribute('src') ?? '',
                description: '',
                store: 'Tunisianet'
            }))
        );

        return products.map(p => ({ ...p, category }));
    } catch (err) {
        return [];
    } finally {
        await page.close();
    }
}

async function scrapeTunisianetCategory(browser: Browser, categoryUrl: string): Promise<IProductInput[]> {
    const category = categoryFromUrl(categoryUrl);
    const allProducts: IProductInput[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
        const pagesToScrape = [currentPage, currentPage + 1];
        const results = await Promise.all(
            pagesToScrape.map(p => scrapeTunisianetPage(browser, categoryUrl, p, category))
        );

        const flattened = results.flat();
        if (flattened.length === 0 || results.some(r => r.length === 0)) {
            hasMore = false;
        }
        
        allProducts.push(...flattened);
        if (currentPage > 50) break;
        currentPage += 2;
    }

    return allProducts;
}

export async function scrapeTunisianet() {
    const startTime = Date.now();
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
        const categoryUrls = await discoverTunisianetCategories(browser);
        let completed = 0;
        const total = categoryUrls.length;
        const allProducts: IProductInput[] = [];

        console.log(`Starting optimized Tunisianet parallel scrape...`);

        await parallelLimit(categoryUrls, 3, async (url) => {
            try {
                const products = await scrapeTunisianetCategory(browser, url);
                allProducts.push(...products);
                
                completed++;
                const percentage = Math.round((completed / total) * 100);
                const elapsed = (Date.now() - startTime) / 1000;
                const eta = completed > 0 ? Math.round((elapsed / completed) * (total - completed)) : 0;
                
                console.log(`[Tunisianet] ${percentage}% | Scraped ${completed}/${total} | Products: ${products.length} | ETA: ${eta}s`);
            } catch (err) {
                console.error(`Failed to scrape ${url}:`, err);
                completed++;
            }
        });

        const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`\n✅ Tunisianet complete! Total: ${allProducts.length} in ${totalTime}s`);
        
        return allProducts;
    } finally {
        await browser.close();
    }
}