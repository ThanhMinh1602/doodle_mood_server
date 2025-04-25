const socketIo = require('socket.io');
const { registerUser, handleDisconnect } = require('./handlers/user-handler');
const { handleSendMessage } = require('./handlers/message-handler');

function initSocket(server) {
  const io = socketIo(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;

    if (!userId) {
      console.log('❌ Thiếu userId khi kết nối');
      return socket.disconnect();
    }
    socket.emit('socket_initial');
    console.log('🟢 Kết nối socket:', socket.id, '| userId:', userId);
    socket.join(userId); // Cho vào room theo userId

    // Đăng ký các socket handler
    registerUser({socket, userId });       
    handleSendMessage({ io, socket });  
    handleDisconnect({ socket, userId });      

  });

  return io;
}

module.exports = { initSocket };
