import { Response } from 'express';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import User from '../models/User';
import { signToken } from '../utils/token';
import { AuthedRequest } from '../middleware/auth';

function publicUser(user: any) {
  return { id: user._id, name: user.name, email: user.email, avatarUrl: user.avatarUrl };
}

export async function register(req: AuthedRequest, res: Response) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: 'An account with that email already exists' });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email: email.toLowerCase(), passwordHash });
  const token = signToken({ userId: user.id });
  res.status(201).json({ token, user: publicUser(user) });
}

export async function login(req: AuthedRequest, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = signToken({ userId: user.id });
  res.json({ token, user: publicUser(user) });
}

export async function me(req: AuthedRequest, res: Response) {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: publicUser(user) });
}

export async function googleCallbackSuccess(req: AuthedRequest, res: Response) {
  const user: any = req.user;
  const token = signToken({ userId: user.id });
  const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback?token=${token}`;
  res.redirect(redirectUrl);
}
