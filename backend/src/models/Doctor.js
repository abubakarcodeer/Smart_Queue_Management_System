import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    specialty: { type: String, default: '' },
    avgConsultMinutes: { type: Number, default: 10 },
    available: { type: Boolean, default: true },
    // Weekly schedule: e.g. [{ day: 1, start: '09:00', end: '17:00' }]
    schedule: [
      {
        day: { type: Number, min: 0, max: 6 }, // 0 = Sun
        start: String,
        end: String,
      },
    ],
  },
  { timestamps: true }
);

export const Doctor = mongoose.model('Doctor', doctorSchema);
