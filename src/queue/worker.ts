import { Worker } from 'bullmq';
import { scrapeMyTek } from '../scraper/scrapeMyTek.js';
import { scrapeTunisianet } from '../scraper/scrapeTunisianet.js';
import { scrapeScoop } from '../scraper/scrapeScoop.js';
import { updateProduct } from '../updateProducts.js';
import { Redis } from 'ioredis';

// Keep your original Redis connection
const connection = new Redis({
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: null // required by BullMQ
});

new Worker('scrapeQueue', async (job) => {
    console.log(`Starting job ${job.id} (${job.name})...`);

    let products = [];

    try {
        // Handle multiple stores
        // if (job.name === 'scrape-mytek') {
        //     products = await scrapeMyTek();
        // }
        //   else if (job.name === 'scrape-tunisianet') {
        //     products = await scrapeTunisianet();
        // } else 
        if (job.name === 'scrape-scoop') {
            products = await scrapeScoop();
        }
        else {
            console.warn(`Unknown job name: ${job.name}`);
            return;
        }

        console.log(`Scraped ${products.length} products from ${job.name}`);

        for (const product of products) {
            try {
                await updateProduct(product);
            } catch (err) {
                console.error(`Failed to update product ${product.name}:`, err);
            }
        }

        console.log(`All products updated for ${job.name}`);

    } catch (err) {
        console.error(`Job ${job.id} (${job.name}) failed:`, err);
    }
}, { connection });