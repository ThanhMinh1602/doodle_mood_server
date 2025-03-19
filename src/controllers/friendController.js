const FriendRequest = require('../models/frendRequest');
const User = require('../models/user');
const {
  getUserSocketId,
  isUserOnline,
} = require('../services/socket/userSocketHandler');
const mongoose = require('mongoose');
const { getSocketIo } = require('../services/socket/socketService'); // Import socket
const Status = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
});

// Gửi lời mời kết bạn
async function sendFriendRequest(req, res) {
  const { senderId, receiverId } = req.body;
  const io = getSocketIo(); // Lấy instance io
  console.log(req.body);

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
    // Kiểm tra xem hai người đã là bạn bè chưa
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (
      !senderId ||
      !receiverId ||
      senderId.toString() === receiverId.toString()
    ) {
      return res
        .status(400)
        .json({ message: 'Không thể gửi lời mời cho chính mình' });
    }

    // Kiểm tra xem receiverId đã có trong danh sách bạn của senderId chưa
    if (
      sender.friends.includes(receiverId) ||
      receiver.friends.includes(senderId)
    ) {
      return res.status(400).json({ message: 'Hai người đã là bạn bè!' });
    }

    // Kiểm tra xem đã gửi lời mời chưa
    const existingRequest = await FriendRequest.findOne({
      senderId,
      receiverId,
      status: 'pending',
    });
    if (existingRequest) {
      return res.status(400).json({ message: 'Bạn đã gửi lời mời trước đó!' });
    }

    // Tạo lời mời kết bạn mới
    const newFriendRequest = new FriendRequest({ senderId, receiverId });
    await newFriendRequest.save();

    // Gửi thông báo socket nếu người nhận online
    const receiverSocketId = getUserSocketId(receiverId);
    if (isUserOnline(receiverId) && receiverSocketId) {
      io.to(receiverSocketId).emit('receiveFriendRequest', {
        senderId,
        receiverId,
        requestId: newFriendRequest._id,
      });
      console.log(`📩 Yêu cầu kết bạn từ ${senderId} đến ${receiverId}`);
    }

    res.status(201).json({
      message: 'Gửi lời mời kết bạn thành công!',
      requestId: newFriendRequest._id,
    });
  } catch (error) {
    console.error('❌ Lỗi API gửi lời mời:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
}
// Chấp nhận hoặc từ chối lời mời kết bạn
async function acceptFriendRequest(req, res) {
  const { requestId, receiverId, status } = req.body;
  const io = getSocketIo();

  try {
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: 'requestId không hợp lệ' });
    }

    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res
        .status(404)
        .json({ message: 'Không tìm thấy lời mời kết bạn' });
    }

    if (friendRequest.status !== 'pending') {
      return res
        .status(400)
        .json({ message: 'Lời mời đã được xử lý trước đó' });
    }

    const senderId = friendRequest.senderId;

    if (status === 'accepted') {
      // Nếu chấp nhận, thêm bạn vào danh sách của cả hai
      await User.findByIdAndUpdate(senderId, {
        $addToSet: { friends: receiverId },
      });
      await User.findByIdAndUpdate(receiverId, {
        $addToSet: { friends: senderId },
      });

      // Gửi thông báo socket cho người gửi
      const senderSocketId = getUserSocketId(senderId);
      if (isUserOnline(senderId) && senderSocketId) {
        io.to(senderSocketId).emit('friendRequestAccepted', {
          senderId,
          receiverId,
        });
        console.log(`✅ ${receiverId} đã chấp nhận lời mời từ ${senderId}`);
      }
    } else if (status === 'rejected') {
      console.log(`❌ ${receiverId} đã từ chối lời mời từ ${senderId}`);
    }

    // Xóa lời mời kết bạn khỏi DB
    await FriendRequest.findByIdAndDelete(requestId);

    res.status(200).json({
      message: `Lời mời kết bạn đã được ${status} và xóa khỏi hệ thống!`,
    });
  } catch (error) {
    console.error('❌ Lỗi API chấp nhận/từ chối lời mời:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
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
      status: 'pending',
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

    res.status(200).json({
      message: body.length
        ? 'Lấy danh sách lời mời thành công'
        : 'Không có lời mời nào',
      body,
    });
  } catch (error) {
    console.error('❌ Lỗi lấy danh sách lời mời:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
}

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  getFriendRequests,
};
