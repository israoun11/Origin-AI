import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User';
import { AdminUser } from '../models/AdminUser';
import { asyncHandler } from '../utils/asyncHandler';
import { conflict, unauthorized, badRequest } from '../utils/apiError';
import { signToken } from '../utils/jwt';
import { requireCustomer } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();
const password = z.string().min(8, 'At least 8 characters').max(100);

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().toLowerCase(),
  password,
  phone: z.string().trim().max(30).optional(),
});
const loginSchema = z.object({ email: z.string().trim().email().toLowerCase(), password: z.string().min(1) });
const profileSchema = z.object({ name: z.string().trim().min(2).max(80).optional(), phone: z.string().trim().max(30).optional() });
const passwordSchema = z.object({ currentPassword: z.string().min(1), newPassword: password });

const publicUser = (u: { _id: unknown; name: string; email: string; phone?: string | null }) => ({
  id: String(u._id), name: u.name, email: u.email, phone: u.phone ?? '',
});

router.post('/register', validate(registerSchema), asyncHandler(async (req, res) => {
  if (await User.exists({ email: req.body.email })) throw conflict('An account with this email already exists');
  const user = await User.create({
    name: req.body.name, email: req.body.email, phone: req.body.phone,
    passwordHash: await bcrypt.hash(req.body.password, 12),
  });
  res.status(201).json({ token: signToken(user.id, 'customer'), user: publicUser(user) });
}));

router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) throw unauthorized('Invalid email or password');
  res.json({ token: signToken(user.id, 'customer'), user: publicUser(user) });
}));

router.post('/admin/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const admin = await AdminUser.findOne({ email: req.body.email }).select('+passwordHash');
  if (!admin || !(await bcrypt.compare(req.body.password, admin.passwordHash))) throw unauthorized('Invalid email or password');
  res.json({ token: signToken(admin.id, 'admin'), admin: { id: admin.id, name: admin.name, email: admin.email } });
}));

router.get('/me', requireCustomer, asyncHandler(async (req, res) => {
  const user = await User.findById(req.auth!.id);
  if (!user) throw unauthorized('Account no longer exists');
  res.json({ user: publicUser(user) });
}));

router.patch('/me', requireCustomer, validate(profileSchema), asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.auth!.id, { $set: req.body }, { new: true });
  if (!user) throw unauthorized('Account no longer exists');
  res.json({ user: publicUser(user) });
}));

router.post('/change-password', requireCustomer, validate(passwordSchema), asyncHandler(async (req, res) => {
  const user = await User.findById(req.auth!.id).select('+passwordHash');
  if (!user) throw unauthorized('Account no longer exists');
  if (!(await bcrypt.compare(req.body.currentPassword, user.passwordHash))) throw badRequest('Current password is incorrect');
  user.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  await user.save();
  res.json({ message: 'Password updated' });
}));

export default router;
