import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { QueueToken } from '../models/QueueToken.js';
import { Doctor } from '../models/Doctor.js';
import { Appointment } from '../models/Appointment.js';
import { auth } from '../middleware/auth.js';
import { dayKeyFor } from '../lib/queueHelpers.js';
import { emitQueueUpdate } from '../lib/io.js';
import { notify } from '../lib/notify.js';

const router = Router();

// Public live queue view for a doctor (today)
router.get(
  '/:doctorId',
  asyncHandler(async (req, res) => {
    const doctor = await Doctor.findById(req.params.doctorId).populate('user', 'name').populate('department', 'name');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    const dayKey = dayKeyFor();
    const tokens = await QueueToken.find({ doctor: doctor._id, dayKey })
      .sort({ number: 1 })
      .populate('patient', 'name');
    const current = tokens.find((t) => t.status === 'in_progress') || null;
    const waiting = tokens.filter((t) => t.status === 'waiting');
    const completed = tokens.filter((t) => t.status === 'completed').length;
    res.json({
      doctor,
      avgConsultMinutes: doctor.avgConsultMinutes,
      current,
      waiting,
      completedCount: completed,
      total: tokens.length,
    });
  })
);

const ensureDoctorOwnsToken = async (req, token) => {
  if (req.user.role === 'admin') return true;
  const doctor = await Doctor.findOne({ user: req.user._id });
  return doctor && doctor._id.toString() === token.doctor.toString();
};

router.post(
  '/:doctorId/next',
  auth(['doctor', 'admin']),
  asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const dayKey = dayKeyFor();

    // mark current in_progress as completed if any
    const current = await QueueToken.findOne({ doctor: doctorId, dayKey, status: 'in_progress' });
    if (current) {
      current.status = 'completed';
      current.completedAt = new Date();
      await current.save();
      await Appointment.findByIdAndUpdate(current.appointment, { status: 'completed' });
      await notify(current.patient, {
        title: 'Consultation completed',
        body: `Your visit (token #${current.number}) is marked complete.`,
        type: 'queue',
      });
    }

    const next = await QueueToken.findOne({ doctor: doctorId, dayKey, status: 'waiting' }).sort({ number: 1 });
    if (!next) {
      emitQueueUpdate(doctorId, { type: 'queue_empty' });
      return res.json({ message: 'Queue empty', current: null });
    }
    next.status = 'in_progress';
    next.calledAt = new Date();
    await next.save();
    await Appointment.findByIdAndUpdate(next.appointment, { status: 'in_progress' });

    await notify(next.patient, {
      title: `It's your turn — Token #${next.number}`,
      body: 'Please proceed to the doctor’s room.',
      type: 'queue',
      email: true,
    });

    // notify next-in-line
    const upcoming = await QueueToken.findOne({
      doctor: doctorId,
      dayKey,
      status: 'waiting',
      number: { $gt: next.number },
    }).sort({ number: 1 });
    if (upcoming) {
      await notify(upcoming.patient, {
        title: `You're next — Token #${upcoming.number}`,
        body: 'Please be ready, your turn is coming up.',
        type: 'queue',
      });
    }

    emitQueueUpdate(doctorId, { type: 'next_called', current: next });
    res.json({ current: next });
  })
);

router.post(
  '/token/:tokenId/complete',
  auth(['doctor', 'admin']),
  asyncHandler(async (req, res) => {
    const token = await QueueToken.findById(req.params.tokenId);
    if (!token) return res.status(404).json({ message: 'Not found' });
    if (!(await ensureDoctorOwnsToken(req, token))) return res.status(403).json({ message: 'Forbidden' });
    token.status = 'completed';
    token.completedAt = new Date();
    await token.save();
    await Appointment.findByIdAndUpdate(token.appointment, { status: 'completed' });
    emitQueueUpdate(token.doctor, { type: 'token_completed', tokenId: token._id });
    res.json(token);
  })
);

router.post(
  '/token/:tokenId/skip',
  auth(['doctor', 'admin']),
  asyncHandler(async (req, res) => {
    const token = await QueueToken.findById(req.params.tokenId);
    if (!token) return res.status(404).json({ message: 'Not found' });
    if (!(await ensureDoctorOwnsToken(req, token))) return res.status(403).json({ message: 'Forbidden' });
    token.status = 'skipped';
    await token.save();
    await Appointment.findByIdAndUpdate(token.appointment, { status: 'skipped' });
    await notify(token.patient, {
      title: `Token #${token.number} skipped`,
      body: 'You were not present when called. Please contact reception.',
      type: 'queue',
      email: true,
    });
    emitQueueUpdate(token.doctor, { type: 'token_skipped', tokenId: token._id });
    res.json(token);
  })
);

export default router;
