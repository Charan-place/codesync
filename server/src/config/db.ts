import mongoose from 'mongoose';
import { env } from './env';

export async function connectDB(): Promise<void> {
  if (!env.mongodbUri) {
    console.warn('[db] MONGODB_URI not set — skipping connection (dev/no-DB mode).');
    return;
  }
  try {
    await mongoose.connect(env.mongodbUri);
    console.log('[db] Connected to MongoDB (codesync_db)');
  } catch (err) {
    console.error('[db] Connection error:', err);
    process.exit(1);
  }
}
