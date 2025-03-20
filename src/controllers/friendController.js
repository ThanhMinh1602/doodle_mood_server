const FriendRequest = require('../models/frendRequest'); // Sửa typo nếu cần thành "friendRequest"
const User = require('../models/user');
const {
  getUserSocketId,
  isUserOnline,
} = require('../services/socket/userSocketHandler');
const mongoose = require('mongoose');
const { getSocketIo } = require('../services/socket/socketService');

const Status = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
});

// Gửi lời mời kết bạn
async function sendFriendRequest(req, res) {
  const { senderId, receiverId } = req.body;
  const io = getSocketIo(); // Lấy instance io

  try {
    if (!senderId || !receiverId) {
      return res
        .status(400)
        .json({ message: 'Thiếu senderId hoặc receiverId' });
    }
    if (senderId === receiverId) {
      return res
        .status(400)
        .json({ message: 'Không thể gửi lời mời cho chính mình' });
    }

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    if (
      sender.friends.includes(receiverId) ||
      receiver.friends.includes(senderId)
    ) {
      return res.status(400).json({ message: 'Hai người đã là bạn bè!' });
    }

    const existingRequest = await FriendRequest.findOne({
      senderId,
      receiverId,
      status: Status.PENDING,
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Bạn đã gửi lời mời trước đó!' });
    }

    // Tạo lời mời mới
    const newFriendRequest = new FriendRequest({ senderId, receiverId });
    await newFriendRequest.save();

    // Dữ liệu gửi qua socket
    const requestData = {
      id: newFriendRequest._id,
      senderBy: {
        id: sender._id,
        name: sender.name,
        email: sender.email,
        avatar: sender.avatar,
      },
      receiverId: receiver._id,
      status: newFriendRequest.status,
      createdAt: newFriendRequest.createdAt,
      updatedAt: newFriendRequest.updatedAt,
    };

    // Gửi thông báo qua socket nếu người nhận online
    const receiverSocketId = getUserSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receiveFriendRequest', requestData);
      console.log(`📩 Yêu cầu kết bạn từ ${senderId} đến ${receiverId}`);
    }

    return res.status(201).json({
      message: 'Gửi lời mời kết bạn thành công!',
      requestId: newFriendRequest._id,
    });
  } catch (error) {
    console.error('❌ Lỗi API gửi lời mời:', error);
    return res
      .status(500)
      .json({ message: 'Lỗi server', error: error.message });
  }
}

// Chấp nhận hoặc từ chối lời mời kết bạn
async function acceptFriendRequest(req, res) {
  const { requestId, receiverId, status } = req.body;
  const io = getSocketIo(); // Lấy instance io

  try {
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: 'requestId không hợp lệ' });
    }

    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res
        .status(404)
        .json({ message: 'Không tìm thấy lời mời kết bạn!' });
    }

    if (friendRequest.status !== Status.PENDING) {
      return res
        .status(400)
        .json({ message: 'Lời mời đã được xử lý trước đó!' });
    }

    const senderId = friendRequest.senderId;

    if (status === Status.ACCEPTED) {
      // Cập nhật danh sách bạn bè
      await Promise.all([
        User.findByIdAndUpdate(senderId, {
          $addToSet: { friends: receiverId },
        }),
        User.findByIdAndUpdate(receiverId, {
          $addToSet: { friends: senderId },
        }),
      ]);

      // Gửi thông báo qua socket tới người gửi nếu họ online
      const senderSocketId = getUserSocketId(senderId);
      if (isUserOnline(senderId) && senderSocketId) {
        io.to(senderSocketId).emit('friendRequestAccepted', {
          senderId,
          receiverId,
        });
        console.log(`✅ ${receiverId} đã chấp nhận lời mời từ ${senderId}`);
      }
    } else if (status === Status.REJECTED) {
      console.log(`❌ ${receiverId} đã từ chối lời mời từ ${senderId}`);
    }

    // Xóa lời mời sau khi xử lý
    await FriendRequest.findByIdAndDelete(requestId);

    return res.status(200).json({
      message: `Lời mời kết bạn đã được ${status} và xóa khỏi hệ thống!`,
    });
  } catch (error) {
    console.error('❌ Lỗi API chấp nhận/từ chối lời mời:', error);
    return res
      .status(500)
      .json({ message: 'Lỗi server', error: error.message });
  }
}

// Lấy danh sách lời mời kết bạn
async function getFriendRequests(req, res) {
  const { userId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'userId không hợp lệ' });
    }

    const requests = await FriendRequest.find({
      receiverId: userId,
      status: Status.PENDING,
    }).populate('senderId', 'id name email avatar');

    const body = requests.map((request) => ({
      id: request._id,
      senderBy: request.senderId
        ? {
            id: request.senderId._id,
            name: request.senderId.name,
            email: request.senderId.email,
            avatar: request.senderId.avatar,
          }
        : null,
      receiverId: request.receiverId,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    }));

    return res.status(200).json({
      message: body.length
        ? 'Lấy danh sách lời mời thành công'
        : 'Không có lời mời nào',
      body,
    });
  } catch (error) {
    console.error('❌ Lỗi lấy danh sách lời mời:', error);
    return res
      .status(500)
      .json({ message: 'Lỗi server', error: error.message });
  }
}

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  getFriendRequests,
};
