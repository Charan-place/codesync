import process from 'node:process';
import express from 'express';
import http from 'node:http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import { Server } from 'socket.io';
import { env } from './config/env';
import { connectDB } from './config/db';
import passport from './config/passport';
import authRoutes from './routes/authRoutes';
import roomRoutes from './routes/roomRoutes';
import snippetRoutes from './routes/snippetRoutes';
import { notFound, errorHandler } from './middleware/errorHandler';
import { registerSocketHandlers } from './sockets';

async function main() {
  await connectDB();

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: env.clientUrl, credentials: true },
  });

  app.use(helmet());
  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
  app.use(
    session({
      secret: env.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: { secure: env.nodeEnv === 'production', httpOnly: true },
    })
  );
  app.use(passport.initialize());

  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'codesync-server' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/rooms', roomRoutes);
  app.use('/api/snippets', snippetRoutes);

  app.use(notFound);
  app.use(errorHandler);

  registerSocketHandlers(io);

  server.listen(env.port, () => {
    console.log(`[server] CodeSync API + sockets listening on :${env.port} (${env.nodeEnv})`);
  });
}

main().catch((err) => {
  console.error('[server] fatal startup error:', err);
  process.exit(1);
});
