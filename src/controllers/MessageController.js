const Message = require('../models/messages');
const { users } = require('../services/socket/userSocketHandler'); // Lấy danh sách user online
const { getUserSocketId } = require('../services/socket/userSocketHandler');

async function sendMessage(socket, io) {
  socket.on('sendMessage', async ({ senderId, receiverId, message }) => {
    const receiverSocketId = getUserSocketId(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receiveMessage', {
        senderId,
        message,
      });
      console.log(`📩 Tin nhắn từ ${senderId} đến ${receiverId}: ${message}`);
    } else {
      console.log(`⚠️ Người dùng ${receiverId} không online`);
    }
  });
}

module.exports = { sendMessage };
