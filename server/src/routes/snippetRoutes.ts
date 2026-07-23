import { Router } from 'express';
import { listSnippets, createSnippet, deleteSnippet } from '../controllers/snippetController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.get('/', listSnippets);
router.post('/', createSnippet);
router.delete('/:id', deleteSnippet);

export default router;
