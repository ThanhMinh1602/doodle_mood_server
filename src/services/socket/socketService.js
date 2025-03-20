const socketIo = require('socket.io');
const { registerUser, handleDisconnect } = require('./userSocketHandler');

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

    // Xử lý ngắt kết nối
    handleDisconnect(socket);
  });

  return io;
}

function getSocketIo() {
  return io;
}

module.exports = { initSocket, getSocketIo };
