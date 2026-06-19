import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { User } from '../models/User.js';
import { Doctor } from '../models/Doctor.js';
import { Appointment } from '../models/Appointment.js';
import { QueueToken } from '../models/QueueToken.js';
import { Department } from '../models/Department.js';
import { auth } from '../middleware/auth.js';
import { startOfDay, endOfDay } from '../lib/queueHelpers.js';

const router = Router();

router.get(
  '/analytics',
  auth(['admin']),
  asyncHandler(async (_req, res) => {
    const [patients, doctors, departments, today, completedToday] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      Doctor.countDocuments(),
      Department.countDocuments(),
      Appointment.countDocuments({ date: { $gte: startOfDay(), $lte: endOfDay() } }),
      Appointment.countDocuments({
        date: { $gte: startOfDay(), $lte: endOfDay() },
        status: 'completed',
      }),
    ]);

    // last 7 days appointments per day
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);
    const daily = await Appointment.aggregate([
      { $match: { date: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // by department today
    const byDept = await Appointment.aggregate([
      { $match: { date: { $gte: startOfDay(), $lte: endOfDay() } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
    ]);
    const deptDocs = await Department.find({ _id: { $in: byDept.map((d) => d._id) } });
    const byDepartment = byDept.map((d) => ({
      name: deptDocs.find((x) => x._id.equals(d._id))?.name || 'Unknown',
      count: d.count,
    }));

    res.json({
      totals: { patients, doctors, departments, todayAppointments: today, completedToday },
      daily,
      byDepartment,
    });
  })
);

router.get(
  '/users',
  auth(['admin']),
  asyncHandler(async (req, res) => {
    const q = req.query.q?.toString().trim();
    const filter = q
      ? { $or: [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }] }
      : {};
    res.json(await User.find(filter).sort({ createdAt: -1 }).limit(200));
  })
);

router.get(
  '/queues',
  auth(['admin']),
  asyncHandler(async (_req, res) => {
    const doctors = await Doctor.find().populate('user', 'name').populate('department', 'name');
    const out = await Promise.all(
      doctors.map(async (d) => {
        const waiting = await QueueToken.countDocuments({ doctor: d._id, status: 'waiting' });
        const inProgress = await QueueToken.countDocuments({ doctor: d._id, status: 'in_progress' });
        return { doctor: d, waiting, inProgress };
      })
    );
    res.json(out);
  })
);

export default router;
