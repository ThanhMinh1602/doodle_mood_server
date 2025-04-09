const Message = require('../models/messages');

async function getConversation(req, res) {
  const { user1Id, user2Id } = req.params;

  try {
    const body = await Message.find({
      $or: [
        { senderId: user1Id, receiverId: user2Id },
        { senderId: user2Id, receiverId: user1Id },
      ],
    }).sort({ timestamp: 1 });

    return res.status(200).json({
      success: true,
      message: 'Lấy tin nhắn thành công',
      data: {
        body: body.map((message) => ({
          id: message._id,
          senderId: message.senderId,
          receiverId: message.receiverId,
          content: message.content,
          timestamp: message.timestamp,
        })),
        total: body.length,
      },
    });
  } catch (error) {
    console.error('❌ Lỗi lấy tin nhắn:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy tin nhắn',
    });
  }
}

async function handleSendMessage(io, socket, data) {
  const { senderId, receiverId, content } = data;

  if (!senderId || !receiverId || !content) {
    return socket.emit('error', 'Thiếu thông tin tin nhắn');
  }

  try {
    const newMessage = await Message.create({ senderId, receiverId, content });

    const payload = {
      id: newMessage._id,
      senderId,
      receiverId,
      content,
      timestamp: newMessage.timestamp,
    };

    // Gửi tới người nhận
    io.to(receiverId).emit('newMessage', payload);

    // Gửi lại cho người gửi (xác nhận)
    socket.emit('newMessage', payload);
  } catch (error) {
    console.error('❌ Lỗi xử lý sendMessage socket:', error);
    socket.emit('error', 'Lỗi gửi tin nhắn');
  }
}

module.exports = {
  handleSendMessage,
  getConversation,
};
