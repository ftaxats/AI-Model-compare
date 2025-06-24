// Vercel serverless function entry point
import { createServer } from '../server/index';
import { registerRoutes } from '../server/routes';

// Create and configure Express app for Vercel
const app = createServer();

// Initialize routes
let initialized = false;
const initializeApp = async () => {
  if (!initialized) {
    await registerRoutes(app);
    initialized = true;
  }
  return app;
};

// Export the handler for Vercel
export default async (req: any, res: any) => {
  const app = await initializeApp();
  return app(req, res);
};