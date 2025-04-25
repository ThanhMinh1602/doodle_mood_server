const Message = require('../../../models/messages')
const User = require('../../../models/user');
const {
  sendNotification,
} = require('../../firebase/notification_service');
async function handleSendMessage({ io, socket }) {
  socket.on('send_message', async (data) => {
    const { senderId, receiverId, content } = data;

    if (!senderId || !receiverId || !content?.trim()) {
      return socket.emit('error', '❌ Thiếu thông tin tin nhắn');
    }

    const trimmedContent = content.trim();
    const timestamp = Date.now().toString(); // Ép sang string

    const payload = {
      tempId: `temp_${timestamp}_${Math.random().toString(36).slice(2, 8)}`,
      senderId,
      receiverId,
      content: trimmedContent,
      timestamp,           // giờ là string
      status: 'sending',
    };


    // ✅ Emit NGAY LẬP TỨC đến cả sender và receiver
    io.to(receiverId).emit('new_message', payload);
    socket.emit('new_message', payload);

    try {
      const messageDoc = new Message({
        senderId,
        receiverId,
        content: trimmedContent,
        timestamp,
      });

      const [_, sender, receiver] = await Promise.all([
        messageDoc.save(),
        User.findById(senderId).select('name'),
        User.findById(receiverId).select('deviceToken'),
      ]);

      // ✅ Cập nhật lại client nếu cần sync ID thật
      const confirmedPayload = {
        id: messageDoc._id,
        senderId,
        receiverId,
        content: trimmedContent,
        timestamp,
        status: 'sent',
      };

      // Gửi sync lại cho 2 bên nếu bạn muốn cập nhật ID thật
      io.to(receiverId).emit('message_confirmed', confirmedPayload);
      socket.emit('message_confirmed', confirmedPayload);

      // Gửi notification
      if (receiver?.deviceToken && sender?.name) {
        sendNotification(receiver.deviceToken, sender.name, trimmedContent)
          .catch(err => console.error('❌ Lỗi push notification:', err));
      }

    } catch (error) {
      console.error('❌ Lỗi lưu DB:', error);
      socket.emit('message_failed', { tempId: payload.tempId, error: 'Lỗi lưu tin nhắn' });
    }
  });
}



module.exports = {
    handleSendMessage
}