import mongoose from 'mongoose';

const queueTokenSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    dayKey: { type: String, required: true, index: true }, // YYYY-MM-DD
    number: { type: Number, required: true }, // sequential per doctor per day
    status: {
      type: String,
      enum: ['waiting', 'in_progress', 'completed', 'skipped'],
      default: 'waiting',
      index: true,
    },
    calledAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

queueTokenSchema.index({ doctor: 1, dayKey: 1, number: 1 }, { unique: true });

export const QueueToken = mongoose.model('QueueToken', queueTokenSchema);
