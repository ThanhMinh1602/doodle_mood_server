const mongoose = require('mongoose');
const FriendRequest = require('../models/frendRequest');
const User = require('../models/user');
const {
  sendNotification,
  MessagingType,
} = require('../services/firebase/notification_service');

const Status = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
});

// Gửi lời mời kết bạn
async function sendFriendRequest(req, res) {
  const { senderId, receiverId } = req.body;

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

    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId),
    ]);

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

    const newFriendRequest = new FriendRequest({ senderId, receiverId });

    // Dùng Promise.all để đảm bảo cả lưu vào DB và gửi thông báo phải thành công
    await Promise.all([
      newFriendRequest.save(),
      sendNotification(
        receiver.deviceToken,
        'Lời mời kết bạn',
        `${sender.name} đã gửi cho bạn một lời mời kết bạn!`
      ),
    ]).catch(async (error) => {
      console.error('❌ Lỗi trong quá trình gửi lời mời:', error);

      // Nếu có lỗi, xóa lời mời đã lưu (nếu có)
      await FriendRequest.findByIdAndDelete(newFriendRequest._id);
      throw new Error('Gửi lời mời kết bạn thất bại!');
    });

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

  try {
    if (!requestId || !receiverId || !status) {
      return res
        .status(400)
        .json({ message: 'Thiếu requestId, receiverId hoặc status' });
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

    const { senderId } = friendRequest;

    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId),
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({ message: 'Người dùng không tồn tại!' });
    }

    let responseMessage = '';

    if (status === Status.ACCEPTED) {
      // Cập nhật danh sách bạn bè của cả hai người
      await Promise.all([
        User.findByIdAndUpdate(senderId, {
          $addToSet: { friends: receiverId },
        }),
        User.findByIdAndUpdate(receiverId, {
          $addToSet: { friends: senderId },
        }),
      ]);

      responseMessage = `${receiver.name} đã chấp nhận lời mời kết bạn của bạn!`;
    } else if (status === Status.REJECTED) {
      responseMessage = `${receiver.name} đã từ chối lời mời kết bạn của bạn!`;
    }

    // Dùng Promise.all để đảm bảo nếu thông báo lỗi, thì lời mời không bị xóa
    await Promise.all([
      FriendRequest.findByIdAndDelete(requestId),
      sendNotification(
        sender.deviceToken,
        'Phản hồi lời mời kết bạn',
        responseMessage
      ),
    ]).catch(async (error) => {
      console.error('❌ Lỗi khi chấp nhận/từ chối lời mời:', error);
      throw new Error('Xử lý lời mời kết bạn thất bại!');
    });

    return res.status(200).json({
      message: `Lời mời kết bạn đã được ${status} thành công!`,
      requestId,
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

    // Lọc bỏ lời mời mà senderId trùng với userId
    const filteredRequests = requests.filter(
      (request) =>
        request.senderId && request.senderId._id.toString() !== userId
    );

    const body = filteredRequests.map((request) => ({
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
