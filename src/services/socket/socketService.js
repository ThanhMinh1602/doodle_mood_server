const socketIo = require('socket.io');
const { registerUser, handleDisconnect } = require('./userSocketHandler');
const { sendMessage } = require('../../controllers/MessageController');

function initSocket(server) {
  io = socketIo(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    console.log(
      '🟢 Người dùng kết nối với socket id:',
      socket.id,
      ' + ',
      'userID:',
      userId
    );
    if (!userId) {
      console.log('❌ Thiếu userId khi kết nối');
      return socket.disconnect();
    }

    socket.join(userId);

    // Đăng ký user online
    registerUser(socket);
    // Xử lý gửi tin nhắn
    sendMessage(socket, io);
    // Xử lý ngắt kết nối
    handleDisconnect(socket);
  });

  return io;
}

module.exports = { initSocket };
