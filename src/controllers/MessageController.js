const Message = require('../models/messages');
const {
  getUserSocketId,
  onlineUsers,
} = require('../services/socket/userSocketHandler'); // Thêm onlineUsers vào import

async function sendMessage(socket, io) {
  socket.on('sendMessage', async (data) => {
    const { receiverId, content } = data;

    // Xác định senderId từ socket
    let senderId = null;
    for (let [userId, socketId] of onlineUsers) {
      if (socketId === socket.id) {
        senderId = userId;
        break;
      }
    }

    if (!senderId) {
      console.error('❌ Không xác định được senderId từ socket');
      return;
    }

    // Tạo message instance
    const message = new Message({
      senderId,
      receiverId,
      content,
    });

    const receiverSocketId = getUserSocketId(receiverId);

    try {
      // Đảm bảo lưu DB và gửi socket nếu online
      const saveMessagePromise = message.save();

      const sendSocketPromise = new Promise((resolve) => {
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receiveMessage', message);
          console.log(`📩 Gửi tin nhắn socket đến ${receiverId}`);
        }
        resolve(); // vẫn resolve nếu offline để không làm lỗi toàn bộ
      });

      // Thực hiện cả 2 promise
      await Promise.all([saveMessagePromise, sendSocketPromise]);
      console.log('✅ Tin nhắn đã lưu và xử lý socket xong');

      // Nếu offline thì gửi FCM
      if (!receiverSocketId) {
        // để xử lý sau
      }
      // Gửi lại cho sender
      socket.emit('receiveMessage', message);
    } catch (error) {
      console.error('❌ Lỗi trong khi xử lý tin nhắn:', error);
    }
  });
}

async function getMessages(socket, io) {
  socket.on('getMessages', async (data) => {
    const { otherUserId } = data;

    // Xác định senderId từ socket
    let currentUserId = null;
    for (let [userId, socketId] of onlineUsers) {
      if (socketId === socket.id) {
        currentUserId = userId;
        break;
      }
    }

    if (!currentUserId) {
      console.error('❌ Không xác định được currentUserId từ socket');
      socket.emit('error', { message: 'Không thể xác định người dùng' });
      return;
    }

    try {
      // Lấy tất cả tin nhắn giữa hai người dùng
      const messages = await Message.find({
        $or: [
          { senderId: currentUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUserId },
        ],
      })
        .sort({ createdAt: 1 }) // Sắp xếp theo thời gian tăng dần
        .lean(); // Chuyển thành plain JavaScript object

      // Gửi danh sách tin nhắn về client
      socket.emit('messageHistory', {
        messages,
        otherUserId,
      });

      console.log(
        `✅ Đã gửi lịch sử tin nhắn giữa ${currentUserId} và ${otherUserId}`
      );
    } catch (error) {
      console.error('❌ Lỗi khi lấy tin nhắn:', error);
      socket.emit('error', {
        message: 'Lỗi khi lấy tin nhắn',
        error: error.message,
      });
    }
  });
}

module.exports = { sendMessage, getMessages };
