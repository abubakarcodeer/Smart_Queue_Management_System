import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    dob: Date,
    gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Patient = mongoose.model('Patient', patientSchema);
