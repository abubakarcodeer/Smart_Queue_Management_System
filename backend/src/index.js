import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.js';
import departmentRoutes from './routes/departments.js';
import doctorRoutes from './routes/doctors.js';
import appointmentRoutes from './routes/appointments.js';
import queueRoutes from './routes/queue.js';
import adminRoutes from './routes/admin.js';
import notificationRoutes from './routes/notifications.js';
import { errorHandler } from './middleware/error.js';
import { attachIO } from './lib/io.js';

const PORT = process.env.PORT || 4000;
const ALLOWED_ORIGINS = [
  process.env.CLIENT_ORIGIN,
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean);

await mongoose.connect(process.env.MONGO_URI);
console.log('✓ MongoDB connected');

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true
  }
});
attachIO(io);

io.on('connection', (socket) => {
  socket.on('join:queue', ({ doctorId }) => doctorId && socket.join(`queue:${doctorId}`));
  socket.on('join:user', ({ userId }) => userId && socket.join(`user:${userId}`));
});

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(errorHandler);

server.listen(PORT, () => console.log(`✓ API + Socket.io on http://localhost:${PORT}`));
