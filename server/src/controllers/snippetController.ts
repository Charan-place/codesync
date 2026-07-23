import { Response } from 'express';
import Snippet from '../models/Snippet';
import { AuthedRequest } from '../middleware/auth';

export async function listSnippets(req: AuthedRequest, res: Response) {
  const snippets = await Snippet.find({ ownerId: req.userId }).sort({ savedAt: -1 });
  res.json({ snippets });
}

export async function createSnippet(req: AuthedRequest, res: Response) {
  const { title, content, language, roomId } = req.body;
  if (!content) return res.status(400).json({ error: 'content is required' });
  const snippet = await Snippet.create({
    ownerId: req.userId,
    roomId,
    title: title || 'Untitled snippet',
    content,
    language: language || 'javascript',
  });
  res.status(201).json({ snippet });
}

export async function deleteSnippet(req: AuthedRequest, res: Response) {
  const snippet = await Snippet.findOne({ _id: req.params.id, ownerId: req.userId });
  if (!snippet) return res.status(404).json({ error: 'Snippet not found' });
  await snippet.deleteOne();
  res.status(204).send();
}
