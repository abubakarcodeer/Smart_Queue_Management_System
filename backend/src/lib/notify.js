import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { emitNotification } from './io.js';
import { sendMail } from './mailer.js';

export async function notify(userId, { title, body, type = 'system', email = false }) {
  const n = await Notification.create({ user: userId, title, body, type });
  emitNotification(userId, n);
  if (email) {
    const user = await User.findById(userId);
    if (user?.email) {
      await sendMail({
        to: user.email,
        subject: title,
        html: `<h2>${title}</h2><p>${body}</p>`,
      });
    }
  }
  return n;
}
