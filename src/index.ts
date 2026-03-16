import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI as string;

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('MongoDB connected');

        await import('./queue/worker.js');
        await import('./scheduler/cron.js');

        console.log('Worker and scheduler started');
    })
    .catch(err => console.error(err));