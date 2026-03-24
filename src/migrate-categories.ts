/**
 * migrate-categories.ts
 * One-time migration: reads every product from MongoDB and sets parentCategory + subcategory
 * using the taxonomy mapping.
 *
 * Run with:  npx tsx src/migrate-categories.ts
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { mapCategory } from './utils/taxonomy.js';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('❌  MONGO_URI not set in .env');
    process.exit(1);
}

const BATCH_SIZE = 100;

async function run() {
    console.log('🔌  Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI as string);
    console.log('✅  Connected');

    const db = mongoose.connection.db!;
    const collection = db.collection('products');

    const total = await collection.countDocuments();
    console.log(`📦  Total products: ${total}`);

    let processed = 0;
    let updated = 0;

    // Process in batches using a cursor to avoid loading everything into memory
    const cursor = collection.find({}, { projection: { _id: 1, category: 1 } });

    const bulkOps: mongoose.mongo.AnyBulkWriteOperation[] = [];

    for await (const doc of cursor) {
        const raw: string = (doc.category as string) ?? '';
        const { parent: parentCategory, subcategory } = mapCategory(raw);

        bulkOps.push({
            updateOne: {
                filter: { _id: doc._id },
                update: { $set: { parentCategory, subcategory } },
            },
        });

        processed++;

        // Flush batch
        if (bulkOps.length >= BATCH_SIZE) {
            const result = await collection.bulkWrite(bulkOps);
            updated += result.modifiedCount;
            bulkOps.length = 0;
            console.log(`  ${processed}/${total} processed — ${updated} updated so far`);
        }
    }

    // Flush remaining
    if (bulkOps.length > 0) {
        const result = await collection.bulkWrite(bulkOps);
        updated += result.modifiedCount;
        console.log(`  ${processed}/${total} processed — ${updated} updated so far`);
    }

    console.log(`\n✅  Migration complete! ${updated}/${total} documents updated.`);
    await mongoose.disconnect();
}

run().catch(err => {
    console.error('❌  Migration failed:', err);
    process.exit(1);
});
