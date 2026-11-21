import { createApp } from '../src/app';
import { connectDB } from '../src/config/db';
import { seedAdmin } from '../src/utils/seedAdmin';

const app = createApp();
let isInitialized = false;

export default async function handler(req: any, res: any) {
  if (!isInitialized) {
    await connectDB();
    await seedAdmin();
    isInitialized = true;
  }
  return app(req, res);
}

