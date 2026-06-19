import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { Notification } from '../models/Notification.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get(
  '/me',
  auth(),
  asyncHandler(async (req, res) => {
    res.json(await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50));
  })
);

router.post(
  '/:id/read',
  auth(),
  asyncHandler(async (req, res) => {
    await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { read: true });
    res.json({ ok: true });
  })
);

router.post(
  '/read-all',
  auth(),
  asyncHandler(async (req, res) => {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ ok: true });
  })
);

router.delete(
  '/:id',
  auth(),
  asyncHandler(async (req, res) => {
    await Notification.deleteOne({ _id: req.params.id, user: req.user._id });
    res.json({ ok: true });
  })
);

router.delete(
  '/',
  auth(),
  asyncHandler(async (req, res) => {
    await Notification.deleteMany({ user: req.user._id });
    res.json({ ok: true });
  })
);

export default router;
