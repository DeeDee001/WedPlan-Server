import { createApp } from '../src/app';
import { connectDB } from '../src/config/db';
import { seedAdmin } from '../src/utils/seedAdmin';

const app = createApp();

let isInitialized = false;

// Middleware to ensure DB connection before handling request in serverless
app.use(async (req, res, next) => {
  if (!isInitialized) {
    try {
      await connectDB();
      seedAdmin().catch(console.error); // Asynchronous non-blocking seed
      isInitialized = true;
    } catch (err) {
      console.error('Serverless DB initialization error:', err);
    }
  }
  next();
});

export default app;
