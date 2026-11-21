import { createApp } from '../src/app';
import { connectDB } from '../src/config/db';
import { seedAdmin } from '../src/utils/seedAdmin';

const app = createApp();

// Eagerly initiate connection on cold start
connectDB().then(() => {
  seedAdmin().catch(console.error);
}).catch(console.error);

export default app;
