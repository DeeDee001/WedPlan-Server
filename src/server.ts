import { createApp } from './app';
import { connectDB } from './config/db';
import { ENV } from './config/env';
import { seedAdmin } from './utils/seedAdmin';

const startServer = async () => {
  await connectDB();
  await seedAdmin();

  const app = createApp();

  const PORT = parseInt(ENV.PORT, 10) || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 WedPlan API Server running on port ${PORT}`);
    console.log(`👉 Client origin configured for: ${ENV.CLIENT_URL}`);
  });
};

startServer();
