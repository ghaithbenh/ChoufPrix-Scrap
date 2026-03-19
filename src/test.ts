import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import * as dotenv from 'dotenv';
dotenv.config();

const connection = new Redis({
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: null
});

const scrapeQueue = new Queue('scrapeQueue', { connection });

// Clear all existing jobs first
await scrapeQueue.obliterate({ force: true });
console.log('Queue cleared!');

// await scrapeQueue.add('scrape-mytek', {});
// await scrapeQueue.add('scrape-tunisianet', {});
await scrapeQueue.add('scrape-scoop', {});
console.log('Jobs added to queue!');

await scrapeQueue.close();
await connection.quit();
process.exit(0);