import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { Doctor } from '../models/Doctor.js';
import { User } from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    const doctors = await Doctor.find(filter)
      .populate('user', 'name email phone')
      .populate('department', 'name');
    res.json(doctors);
  })
);

router.get(
  '/me',
  auth(['doctor']),
  asyncHandler(async (req, res) => {
    const doctor = await Doctor.findOne({ user: req.user._id })
      .populate('user', 'name email phone')
      .populate('department', 'name');
    res.json(doctor);
  })
);

router.post(
  '/',
  auth(['admin']),
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
        phone: z.string().optional(),
        department: z.string(),
        specialty: z.string().optional(),
        avgConsultMinutes: z.number().int().positive().optional(),
      })
      .parse(req.body);

    const exists = await User.findOne({ email: data.email });
    if (exists) return res.status(409).json({ message: 'Email already used' });
    const passwordHash = await User.hashPassword(data.password);
    const user = await User.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: 'doctor',
    });
    const doctor = await Doctor.create({
      user: user._id,
      department: data.department,
      specialty: data.specialty || '',
      avgConsultMinutes: data.avgConsultMinutes || 10,
    });
    res.json(await doctor.populate(['user', 'department']));
  })
);

router.patch(
  '/:id/availability',
  auth(['doctor', 'admin']),
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        available: z.boolean().optional(),
        avgConsultMinutes: z.number().int().positive().optional(),
        schedule: z
          .array(z.object({ day: z.number().min(0).max(6), start: z.string(), end: z.string() }))
          .optional(),
      })
      .parse(req.body);
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    if (req.user.role === 'doctor' && doctor.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Forbidden' });
    Object.assign(doctor, data);
    await doctor.save();
    res.json(doctor);
  })
);

export default router;
