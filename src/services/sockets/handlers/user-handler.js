const onlineUsers = new Map(); // userId -> socketId

function registerUser({ socket, userId }) {
  // handle auto register if userId != null
  onlineUsers.set(userId, socket.id);
  console.log(`👤 User ${userId} registered with socket ${socket.id}`);

  // Nếu vẫn muốn nghe sự kiện 'register' thì giữ lại:
  socket.on('register', (userIdFromClient) => {
    onlineUsers.set(userIdFromClient, socket.id);
    console.log(`👤 User ${userIdFromClient} registered via event with socket ${socket.id}`);
  });
}

function handleDisconnect({ socket, userId }) {
  socket.on('disconnect', () => {
    if (onlineUsers.get(userId) === socket.id) {
      onlineUsers.delete(userId);
      console.log(`🔴 User ${userId} disconnected`);
    } else {
      // Trường hợp phòng hờ nếu userId không khớp socket id
      for (let [uid, socketId] of onlineUsers) {
        if (socketId === socket.id) {
          onlineUsers.delete(uid);
          console.log(`🔴 User ${uid} disconnected`);
          break;
        }
      }
    }
  });
}

function getUserSocketId(userId) {
  return onlineUsers.get(userId);
}

module.exports = {
  registerUser,
  handleDisconnect,
  getUserSocketId,
  onlineUsers,
};
