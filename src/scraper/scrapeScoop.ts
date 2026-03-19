import { chromium } from 'playwright';
import type { IProductInput } from '../models/product.js';
import { categoryFromUrl } from '../utils/categorize.js';

async function discoverScoopCategories(): Promise<string[]> {
    console.log('Discovering Scoop categories from sitemap page...');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto('https://www.scoop.com.tn/sitemap', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        const urls = await page.$$eval('a[href]', (links: HTMLAnchorElement[]) =>
            links
                .map(link => link.href)
                .filter(href =>
                    href.includes('scoop.com.tn') &&
                    href.match(/\/\d+-/) &&
                    !href.includes('?') &&
                    !href.includes('.html')
                )
        );

        const uniqueUrls = [...new Set(urls)];
        console.log(`Found ${uniqueUrls.length} categories`);
        return uniqueUrls;
    } finally {
        await page.close();
        await browser.close();
    }
}

async function scrapeWorker(
    categories: string[],
    workerId: number,
    results: IProductInput[]
): Promise<void> {
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();

    // Block images and fonts to speed up
    await page.route('**/*', route => {
        if (['image', 'stylesheet', 'font'].includes(route.request().resourceType())) {
            route.abort();
        } else {
            route.continue();
        }
    });

    for (const url of categories) {
        const category = categoryFromUrl(url);
        console.log(`[Worker ${workerId}] Scraping: ${category}`);

        try {
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(2000);

            // Infinite scroll
            let previousCount = 0;
            let stagnated = 0;

            while (true) {
                const currentCount = await page.$$eval(
                    '.tvproduct-catalog-wrapper',
                    (items: Element[]) => items.length
                );

                if (currentCount === previousCount) {
                    stagnated++;
                    if (stagnated >= 2) break;
                } else {
                    stagnated = 0;
                }

                if (currentCount > 500) break;

                previousCount = currentCount;
                await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                await page.waitForTimeout(1000);
            }

            const products = await page.$$eval('.tvproduct-catalog-wrapper', (items: Element[]) =>
                items.map(item => ({
                    name: item.querySelector('.tvproduct-name')?.textContent?.trim() ?? '',
                    price: Number(item.querySelector('.price')?.textContent?.replace(/[^0-9]/g, '')),
                    url: item.querySelector('.product-thumbnail')?.getAttribute('href') ?? '',
                    image: item.querySelector('.tvproduct-defult-img')?.getAttribute('src') ?? '',
                    description: item.querySelector('.tv-product-desc')?.textContent?.trim() ?? '',
                    store: 'Scoop' as const,
                }))
            );

            const valid = products.filter(p => p.name && p.price > 0);
            console.log(`[Worker ${workerId}] ${category}: ${valid.length} products`);
            results.push(...valid.map(p => ({ ...p, category })));

        } catch (err) {
            console.error(`[Worker ${workerId}] Failed: ${url}`, err);
        }
    }

    await browser.close();
}

export async function scrapeScoop(): Promise<IProductInput[]> {
    const startTime = Date.now();
    const categoryUrls = await discoverScoopCategories();

    if (categoryUrls.length === 0) {
        console.log('No categories found!');
        return [];
    }

    console.log(`Starting 3 parallel workers for ${categoryUrls.length} categories...`);

    const allProducts: IProductInput[] = [];
    const WORKERS = 3;

    // Split categories between workers
    const chunks: string[][] = Array.from({ length: WORKERS }, () => []);
    categoryUrls.forEach((url, i) => chunks[i % WORKERS].push(url));

    // Run 3 separate browsers in parallel
    await Promise.all(
        chunks.map((chunk, i) => scrapeWorker(chunk, i + 1, allProducts))
    );

    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log(`\n✅ Scoop complete! ${allProducts.length} products in ${totalTime} minutes`);
    return allProducts;
}