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

async function discoverScoopCategories(browser: Browser): Promise<string[]> {
    console.log('Discovering categories on Scoop...');
    const page = await browser.newPage();
    await setupPage(page);
    
    try {
        await page.goto('https://www.scoop.com.tn', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('a[href]', { timeout: 10000 });

        const urls = await page.$$eval('a[href]', (links: HTMLAnchorElement[]) =>
            links
                .map(link => link.href)
                .filter(href =>
                    href.includes('scoop.com.tn') &&
                    href.match(/\/[0-9]+-/) && 
                    !href.includes('.html') && 
                    !href.includes('?')
                )
        );

        const uniqueUrls = [...new Set(urls)];
        console.log(`Found ${uniqueUrls.length} potential categories on Scoop`);
        return uniqueUrls;
    } finally {
        await page.close();
    }
}

async function scrapeScoopCategory(browser: Browser, url: string): Promise<IProductInput[]> {
    const page = await browser.newPage();
    await setupPage(page);
    const category = categoryFromUrl(url);
    
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        let previousCount = 0;
        let stagnated = 0;
        
        while (true) {
            const currentCount = await page.$$eval('.tvproduct-catalog-wrapper', (items: Element[]) => items.length);
            
            if (currentCount === previousCount) {
                stagnated++;
                if (stagnated >= 2) break; // If no change after 2 scrolls, we're done
            } else {
                stagnated = 0;
            }

            if (currentCount > 500) break; // Safety cap

            previousCount = currentCount;
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            // Faster scroll wait
            await page.waitForTimeout(1000); 
        }

        const products = await page.$$eval('.tvproduct-catalog-wrapper', (items: Element[]) =>
            items.map(item => ({
                name: item.querySelector('.tvproduct-name')?.textContent?.trim() ?? '',
                price: Number(item.querySelector('.price')?.textContent?.replace(/[^0-9]/g, '')),
                url: item.querySelector('.product-thumbnail')?.getAttribute('href') ?? '',
                image: item.querySelector('.tvproduct-defult-img')?.getAttribute('src') ?? '',
                description: item.querySelector('.tv-product-desc')?.textContent?.trim() ?? '',
                store: 'Scoop'
            }))
        );

        return products.map(p => ({ ...p, category }));
    } catch (err) {
        return [];
    } finally {
        await page.close();
    }
}

export async function scrapeScoop() {
    const startTime = Date.now();
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
        const categoryUrls = await discoverScoopCategories(browser);
        let completed = 0;
        const total = categoryUrls.length;
        const allProducts: IProductInput[] = [];

        console.log(`Starting optimized Scoop parallel category scrape...`);

        await parallelLimit(categoryUrls, 3, async (url) => {
            try {
                const products = await scrapeScoopCategory(browser, url);
                allProducts.push(...products);
                
                completed++;
                const percentage = Math.round((completed / total) * 100);
                const elapsed = (Date.now() - startTime) / 1000;
                const eta = completed > 0 ? Math.round((elapsed / completed) * (total - completed)) : 0;
                
                console.log(`[Scoop] ${percentage}% | Scraped ${completed}/${total} | Products: ${products.length} | ETA: ${eta}s`);
            } catch (err) {
                console.error(`Failed to scrape ${url}:`, err);
                completed++;
            }
        });

        const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`\n✅ Scoop complete! Total: ${allProducts.length} in ${totalTime}s`);
        
        return allProducts;
    } finally {
        await browser.close();
    }
}