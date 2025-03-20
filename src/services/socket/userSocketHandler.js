const onlineUsers = new Map(); // Lưu trữ userId -> socketId

function registerUser(socket) {
  socket.on('register', (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`👤 User ${userId} registered with socket ${socket.id}`);
  });
}

function handleDisconnect(socket) {
  socket.on('disconnect', () => {
    for (let [userId, socketId] of onlineUsers) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`🔴 User ${userId} disconnected`);
        break;
      }
    }
  });
}

function getUserSocketId(userId) {
  return onlineUsers.get(userId);
}

function isUserOnline(userId) {
  return onlineUsers.has(userId);
}

module.exports = {
  registerUser,
  handleDisconnect,
  getUserSocketId,
  isUserOnline,
};
