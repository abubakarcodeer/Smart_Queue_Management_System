import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient', index: true },
  },
  { timestamps: true }
);

userSchema.methods.checkPassword = function (pw) {
  return bcrypt.compare(pw, this.passwordHash);
};

userSchema.statics.hashPassword = (pw) => bcrypt.hash(pw, 10);

userSchema.methods.toJSON = function () {
  const o = this.toObject();
  delete o.passwordHash;
  return o;
};

export const User = mongoose.model('User', userSchema);
