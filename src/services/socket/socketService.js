const socketIo = require('socket.io');
const { registerUser, handleDisconnect } = require('./userSocketHandler');
const { sendMessage } = require('../../controllers/MessageController');

let io;

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
    // Xử lý gửi tin nhắn
    sendMessage(socket, io);
    // Xử lý ngắt kết nối
    handleDisconnect(socket);
  });

  return io;
}

module.exports = { initSocket };
