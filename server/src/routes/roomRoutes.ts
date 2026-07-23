import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createRoom, getRoom, verifyRoomPassword, updateRoom, myRooms } from '../controllers/roomController';
import { executeCode } from '../controllers/executeController';
import { optionalAuth, requireAuth } from '../middleware/auth';

const router = Router();

const createLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
const execLimiter = rateLimit({ windowMs: 60 * 1000, max: 15 });

router.post('/', createLimiter, optionalAuth, createRoom);
router.get('/mine', requireAuth, myRooms);
router.get('/:slug', optionalAuth, getRoom);
router.post('/:slug/verify-password', optionalAuth, verifyRoomPassword);
router.patch('/:slug', requireAuth, updateRoom);
router.post('/:slug/execute', execLimiter, optionalAuth, executeCode);

export default router;
