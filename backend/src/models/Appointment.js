import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    date: { type: Date, required: true, index: true }, // appointment day
    reason: { type: String, default: '' },
    status: {
      type: String,
      enum: ['booked', 'in_progress', 'completed', 'skipped', 'cancelled'],
      default: 'booked',
      index: true,
    },
  },
  { timestamps: true }
);

export const Appointment = mongoose.model('Appointment', appointmentSchema);
