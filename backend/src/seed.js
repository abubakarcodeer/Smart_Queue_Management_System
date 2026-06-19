import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './models/User.js';
import { Department } from './models/Department.js';
import { Doctor } from './models/Doctor.js';
import { Patient } from './models/Patient.js';

await mongoose.connect(process.env.MONGO_URI);

await Promise.all([
  User.deleteMany({}),
  Department.deleteMany({}),
  Doctor.deleteMany({}),
  Patient.deleteMany({}),
]);

const dept = await Department.create({ name: 'General Medicine', description: 'General consultations' });
await Department.create({ name: 'Pediatrics', description: 'Children health' });

const admin = await User.create({
  name: 'Admin',
  email: 'admin@clinic.test',
  passwordHash: await User.hashPassword('admin123'),
  role: 'admin',
});

const docUser = await User.create({
  name: 'Dr. Sarah Lee',
  email: 'doctor@clinic.test',
  passwordHash: await User.hashPassword('doctor123'),
  role: 'doctor',
});
await Doctor.create({
  user: docUser._id,
  department: dept._id,
  specialty: 'General Physician',
  avgConsultMinutes: 8,
});

const patUser = await User.create({
  name: 'John Patient',
  email: 'patient@clinic.test',
  passwordHash: await User.hashPassword('patient123'),
  role: 'patient',
});
await Patient.create({ user: patUser._id });

console.log('✓ Seeded:', { admin: admin.email, doctor: docUser.email, patient: patUser.email });
await mongoose.disconnect();
