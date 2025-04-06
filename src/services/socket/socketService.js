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
    console.log('🟢 Người dùng kết nối:', socket.id);

    // Đăng ký user online
    registerUser(socket);
    // Xử lý ngắt kết nối
    sendMessage(socket, io);
    handleDisconnect(socket);
  });

  return io;
}

module.exports = { initSocket };
