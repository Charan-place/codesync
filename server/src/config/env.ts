import dotenv from 'dotenv';
dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    // Do not throw in dev for optional integrations; log instead.
    console.warn(`[config] Missing env var: ${name}`);
    return '';
  }
  return value;
}

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  serverUrl: required('SERVER_URL', 'http://localhost:5000'),
  clientUrl: required('CLIENT_URL', 'http://localhost:5173'),
  mongodbUri: required('MONGODB_URI'),
  jwtSecret: required('JWT_SECRET', 'dev-insecure-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  sessionSecret: required('SESSION_SECRET', 'dev-insecure-session-secret'),
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || '',
  defaultRoomTtlHours: parseInt(process.env.DEFAULT_ROOM_TTL_HOURS || '24', 10),
  codeExecProvider: process.env.CODE_EXEC_PROVIDER || 'local',
  codeExecTimeoutMs: parseInt(process.env.CODE_EXEC_TIMEOUT_MS || '3000', 10),
};
