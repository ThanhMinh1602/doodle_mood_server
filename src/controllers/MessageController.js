const Message = require('../models/messages');
const { users } = require('../services/socket/userSocketHandler'); // Lấy danh sách user online
const { getUserSocketId } = require('../services/socket/userSocketHandler');

async function sendMessage(socket, io) {
  socket.on('sendMessage', async ({ senderId, receiverId, message }) => {
    try {
      const receiverSocketId = getUserSocketId(receiverId);

      if (receiverSocketId) {
        // Lưu tin nhắn vào database
        const newMessage = new Message({
          senderId,
          receiverId,
          message,
          status: 'sent',
        });
        await newMessage.save();

        // Gửi tin nhắn đến người nhận
        io.to(receiverSocketId).emit('receiveMessage', {
          success: true,
          message: 'Tin nhắn mới',
          data: {
            messageId: newMessage._id,
            senderId,
            message,
            timestamp: newMessage.createdAt,
          },
          error: null,
          statusCode: 200,
        });

        // Xác nhận gửi tin nhắn thành công cho người gửi
        socket.emit('messageSent', {
          success: true,
          message: 'Gửi tin nhắn thành công',
          data: {
            messageId: newMessage._id,
            receiverId,
            message,
            timestamp: newMessage.createdAt,
          },
          error: null,
          statusCode: 200,
        });

        console.log(`📩 Tin nhắn từ ${senderId} đến ${receiverId}: ${message}`);
      } else {
        // Người nhận không online
        socket.emit('messageError', {
          success: false,
          message: 'Người nhận không online',
          data: null,
          error: 'Receiver is offline',
          statusCode: 404,
        });
        console.log(`⚠️ Người dùng ${receiverId} không online`);
      }
    } catch (error) {
      console.error('❌ Lỗi gửi tin nhắn:', error);
      socket.emit('messageError', {
        success: false,
        message: 'Lỗi gửi tin nhắn',
        data: null,
        error: error.message,
        statusCode: 500,
      });
    }
  });
}

module.exports = { sendMessage };
