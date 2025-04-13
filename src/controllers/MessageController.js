const Message = require('../models/messages');
const mongoose = require('mongoose');
const {
  sendNotification,
} = require('../services/firebase/notification_service');
const { formatToVietnamTime } = require('../utils/timeUtils');
const {
  successResponse,
  errorResponse,
  validationError,
  notFoundError,
} = require('../utils/responseUtils');
const { formatUploadedBy } = require('../utils/formatBody');
const User = require('../models/user');
//get message by user1Id and user2Id
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

//send message
async function handleSendMessage(io, socket, data) {
  const { senderId, receiverId, content } = data;

  if (!senderId || !receiverId || !content) {
    return socket.emit('error', 'Thiếu thông tin tin nhắn');
  }

  try {
    const newMessage = await Message.create({
      senderId,
      receiverId,
      content,
      timestamp: formatToVietnamTime(Date.now()),
    });
    const user = await User.findById(receiverId);

    const payload = {
      id: newMessage._id,
      senderId,
      receiverId,
      content,
      timestamp: newMessage.timestamp,
    };
    sendNotification(user.deviceToken, user.name, content);
    // Gửi tới người nhận
    io.to(receiverId).emit('newMessage', payload);

    // Gửi lại cho người gửi (xác nhận)
    socket.emit('newMessage', payload);
  } catch (error) {
    console.error('❌ Lỗi xử lý sendMessage socket:', error);
    socket.emit('error', 'Lỗi gửi tin nhắn');
  }
}

async function getConversationList(req, res) {
  const { userId } = req.params;
  const userObjectId = new mongoose.Types.ObjectId(userId);

  try {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userObjectId }, { receiverId: userObjectId }],
        },
      },
      {
        $addFields: {
          partnerId: {
            $cond: [
              { $eq: ['$senderId', userObjectId] },
              '$receiverId',
              '$senderId',
            ],
          },
        },
      },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$partnerId',
          lastMessage: { $first: '$$ROOT' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'partnerInfo',
        },
      },
      {
        $unwind: {
          path: '$partnerInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          partnerId: '$_id',
          lastMessage: {
            id: '$lastMessage._id',
            content: '$lastMessage.content',
            timestamp: '$lastMessage.timestamp',
          },
          friend: {
            _id: '$partnerInfo._id',
            name: '$partnerInfo.name',
            email: '$partnerInfo.email',
            avatar: '$partnerInfo.avatar',
          },
        },
      },
    ]);

    return successResponse(res, {
      total: conversations.length,
      body: conversations.map((conversation) => ({
        id: conversation.partnerId,
        lastMessage: {
          id: conversation.lastMessage.id,
          content: conversation.lastMessage.content,
          timestamp: conversation.lastMessage.timestamp,
        },
        friend: formatUploadedBy(conversation.friend),
      })),
    });
  } catch (error) {
    console.error('❌ Lỗi khi lấy danh sách trò chuyện:', error);
    return errorResponse(
      res,
      'Lỗi server khi lấy danh sách trò chuyện',
      500,
      error
    );
  }
}

module.exports = {
  handleSendMessage,
  getConversation,
  getConversationList,
};
