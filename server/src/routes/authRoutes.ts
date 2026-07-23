import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import passport from '../config/passport';
import { register, login, me, googleCallbackSuccess } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', requireAuth, me);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  googleCallbackSuccess
);

export default router;
