import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const auth = (roles = []) => async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.sub);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    if (roles.length && !roles.includes(user.role)) return res.status(403).json({ message: 'Forbidden' });
    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
