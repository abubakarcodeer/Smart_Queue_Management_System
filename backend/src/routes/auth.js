import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Patient } from '../models/Patient.js';
import { auth } from '../middleware/auth.js';

const router = Router();

const signToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().optional(),
      password: z.string().min(6),
    });
    const data = schema.parse(req.body);
    const exists = await User.findOne({ email: data.email });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const passwordHash = await User.hashPassword(data.password);
    const user = await User.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: 'patient',
    });
    await Patient.create({ user: user._id });
    res.json({ token: signToken(user), user });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = z
      .object({ email: z.string().email(), password: z.string().min(1) })
      .parse(req.body);
    const user = await User.findOne({ email });
    if (!user || !(await user.checkPassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });
    res.json({ token: signToken(user), user });
  })
);

router.get(
  '/me',
  auth(),
  asyncHandler(async (req, res) => res.json({ user: req.user }))
);

export default router;
