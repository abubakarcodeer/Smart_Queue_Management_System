import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { Appointment } from '../models/Appointment.js';
import { Doctor } from '../models/Doctor.js';
import { QueueToken } from '../models/QueueToken.js';
import { auth } from '../middleware/auth.js';
import { dayKeyFor } from '../lib/queueHelpers.js';
import { emitQueueUpdate } from '../lib/io.js';
import { notify } from '../lib/notify.js';

const router = Router();

router.post(
  '/',
  auth(['patient']),
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        doctorId: z.string(),
        date: z.string(), // ISO date
        reason: z.string().optional(),
      })
      .parse(req.body);

    const doctor = await Doctor.findById(data.doctorId).populate('user', 'name');
    if (!doctor) {
      console.log('Booking failed: Doctor not found', data.doctorId);
      return res.status(404).json({ message: 'Doctor not found' });
    }
    if (!doctor.available) {
      console.log('Booking failed: Doctor not available', doctor.user.name);
      return res.status(400).json({ message: 'Doctor not available' });
    }

    const appointmentDate = new Date(data.date);
    const dayKey = dayKeyFor(appointmentDate);

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctor._id,
      department: doctor.department,
      date: appointmentDate,
      reason: data.reason || '',
    });

    const lastToken = await QueueToken.findOne({ doctor: doctor._id, dayKey }).sort({ number: -1 });
    const number = (lastToken?.number || 0) + 1;
    const token = await QueueToken.create({
      appointment: appointment._id,
      doctor: doctor._id,
      patient: req.user._id,
      dayKey,
      number,
    });

    emitQueueUpdate(doctor._id, { type: 'token_added', tokenId: token._id, number });
    await notify(req.user._id, {
      title: `Token #${number} issued`,
      body: `Your appointment with Dr. ${doctor.user.name} is booked. Track your queue live.`,
      type: 'appointment',
      email: true,
    });

    res.json({ appointment, token });
  })
);

router.get(
  '/me',
  auth(['patient']),
  asyncHandler(async (req, res) => {
    const items = await Appointment.find({ patient: req.user._id })
      .sort({ date: -1 })
      .populate({ path: 'doctor', populate: ['user', 'department'] });
    res.json(items);
  })
);

router.get(
  '/today',
  auth(['doctor']),
  asyncHandler(async (req, res) => {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return res.json([]);
    const dayKey = dayKeyFor();
    const tokens = await QueueToken.find({ doctor: doctor._id, dayKey })
      .sort({ number: 1 })
      .populate('patient', 'name email phone')
      .populate({ path: 'appointment', select: 'reason date status' });
    res.json(tokens);
  })
);

export default router;
