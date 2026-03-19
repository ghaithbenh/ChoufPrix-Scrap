import { chromium } from 'playwright';
import type { IProductInput } from '../models/product.js';

async function discoverMyTekCategories(): Promise<string[]> {
    console.log('Fetching MyTek sitemap...');
    const response = await fetch('https://www.mytek.tn/media/sitemap/sitemap.xml');
    const text = await response.text();

    const urls = [...text.matchAll(/<loc>(.*?)<\/loc>/g)]
        .map(match => match[1])
        .filter((url): url is string => {
            if (!url) return false;
            if (!url.endsWith('.html')) return false;
            if (url.includes('/catalog/')) return false;
            const path = url.replace('https://www.mytek.tn/', '');
            return path.split('/').length >= 2;
        });

    return [...new Set(urls)];
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

    await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    // Block images and CSS to speed up
    await page.route('**/*', route => {
        if (['image', 'stylesheet', 'font'].includes(route.request().resourceType())) {
            route.abort();
        } else {
            route.continue();
        }
    });

    for (const categoryUrl of categories) {
        const categoryName = categoryUrl
            .split('/').pop()
            ?.replace('.html', '')
            .replace(/-/g, ' ') ?? 'Other';

        let pageNum = 1;

        while (true) {
            try {
                await page.goto(`${categoryUrl}?p=${pageNum}`, { waitUntil: 'domcontentloaded' });
                await page.waitForTimeout(1000);

                const products = await page.$$eval('.product-container', (items: Element[]) =>
                    items.map(item => ({
                        name: item.querySelector('.product-item-link')?.textContent?.trim() ?? '',
                        price: Number(item.querySelector('.final-price')?.textContent?.replace(/[^0-9]/g, '') || '0'),
                        url: item.querySelector('.product-item-link')?.getAttribute('href') ?? '',
                        image: item.querySelector('img')?.getAttribute('src') ?? '',
                        description: item.querySelector('.search-short-description')?.textContent?.trim() ?? '',
                        store: 'MyTek' as const,
                    }))
                );

                const valid = products.filter(p => p.name && p.price > 0);
                if (valid.length === 0) break;

                results.push(...valid.map(p => ({ ...p, category: categoryName })));
                console.log(`[Worker ${workerId}] ${categoryName} p${pageNum}: ${valid.length} products`);
                pageNum++;
                await page.waitForTimeout(300);
            } catch {
                break;
            }
        }
    }

    await browser.close();
}

export async function scrapeMyTek(): Promise<IProductInput[]> {
    const startTime = Date.now();
    const categoryUrls = await discoverMyTekCategories();
    console.log(`Found ${categoryUrls.length} categories — starting 3 parallel workers`);

    const allProducts: IProductInput[] = [];
    const WORKERS = 3;

    // Split categories between workers
    const chunks: string[][] = Array.from({ length: WORKERS }, () => []);
    categoryUrls.forEach((url, i) => chunks[i % WORKERS].push(url));

    // Run workers in parallel
    await Promise.all(
        chunks.map((chunk, i) => scrapeWorker(chunk, i + 1, allProducts))
    );

    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log(`\n✅ Done! ${allProducts.length} products in ${totalTime} minutes`);
    return allProducts;
}