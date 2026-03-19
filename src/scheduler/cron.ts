import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

const connection = new Redis();
const scrapeQueue = new Queue('scrapeQueue', { connection });

async function scheduleJobs() {
    console.log('Scheduling scrape jobs...');

    await scrapeQueue.add('scrape-mytek', {}, {
        repeat: { pattern: '0 */6 * * *' }
    });

    // await scrapeQueue.add('scrape-tunisianet', {}, {
    //     repeat: { pattern: '0 */6 * * *' }
    // });

    // await scrapeQueue.add('scrape-scoop', {}, {
    //     repeat: { pattern: '0 */6 * * *' }
    // });

    console.log('All jobs scheduled!');
    await scrapeQueue.close();
}

scheduleJobs().catch(console.error);