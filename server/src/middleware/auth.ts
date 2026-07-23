import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/token';

export interface AuthedRequest extends Request {
  userId?: string;
}

// Requires a valid Bearer token; rejects otherwise.
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const payload = verifyToken(header.slice(7));
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Attaches userId if a valid token is present, but doesn't reject guests.
export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = verifyToken(header.slice(7));
      req.userId = payload.userId;
    } catch {
      /* ignore invalid token for optional auth */
    }
  }
  next();
}
