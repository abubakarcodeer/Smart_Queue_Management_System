import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { Department } from '../models/Department.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  res.json(await Department.find().sort({ name: 1 }));
}));

router.post(
  '/',
  auth(['admin']),
  asyncHandler(async (req, res) => {
    const data = z.object({ name: z.string().min(2), description: z.string().optional() }).parse(req.body);
    res.json(await Department.create(data));
  })
);

router.delete(
  '/:id',
  auth(['admin']),
  asyncHandler(async (req, res) => {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  })
);

export default router;
