let _io = null;
export const attachIO = (io) => { _io = io; };
export const getIO = () => _io;

export const emitQueueUpdate = (doctorId, payload) => {
  _io?.to(`queue:${String(doctorId)}`).emit('queue:update', payload);
};

export const emitNotification = (userId, notification) => {
  _io?.to(`user:${String(userId)}`).emit('notification:new', notification);
};
