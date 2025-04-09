const mongoose = require('mongoose');
const FriendRequest = require('../models/frendRequest');
const User = require('../models/user');
const {
  sendNotification,
  MessagingType,
} = require('../services/firebase/notification_service');
const {
  successResponse,
  errorResponse,
  validationError,
  notFoundError,
} = require('../utils/responseUtils');
const { formatUploadedBy } = require('../utils/formatBody');

const Status = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
});
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

//=================== Gửi lời mời kết bạn ====================\\
async function sendFriendRequest(req, res) {
  const { senderId, receiverId } = req.body;
  const io = req.app.get('io');

  try {
    // 1. Kiểm tra đầu vào
    if (!senderId || !receiverId) {
      return validationError(res, 'Thiếu senderId hoặc receiverId');
    }

    if (!isValidObjectId(senderId) || !isValidObjectId(receiverId)) {
      return validationError(res, 'ID người dùng không hợp lệ');
    }

    if (senderId === receiverId) {
      return validationError(res, 'Không thể gửi lời mời cho chính mình');
    }

    // 2. Tìm người dùng
    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId),
    ]);
    if (!sender || !receiver) {
      return notFoundError(res, 'Người dùng không tồn tại');
    }

    // 3. Kiểm tra quan hệ bạn bè
    if (sender.friends.includes(receiverId)) {
      return validationError(res, 'Hai người đã là bạn bè!');
    }

    const isExist = await FriendRequest.exists({
      senderId,
      receiverId,
      status: Status.PENDING,
    });
    if (isExist) {
      return validationError(res, 'Bạn đã gửi lời mời trước đó!');
    }

    // 4. Lưu lời mời và gửi thông báo
    const newRequest = new FriendRequest({ senderId, receiverId });

    try {
      await Promise.all([
        newRequest.save(),
        sendNotification(
          receiver.deviceToken,
          'Lời mời kết bạn',
          `${sender.name} đã gửi cho bạn một lời mời kết bạn!`
        ).then((_) => {
          // 5. Gửi socket event
          io.to(receiverId).emit('friendRequest', {
            id: newRequest._id,
            senderBy: {
              id: sender._id,
              name: sender.name,
              email: sender.email,
              avatar: sender.avatar,
            },
            receiverId,
            status: Status.PENDING,
            createdAt: newRequest.createdAt,
            updatedAt: newRequest.updatedAt,
          });
        }),
      ]);
    } catch (err) {
      await FriendRequest.findByIdAndDelete(newRequest._id);
      console.error('❌ Gửi lời mời thất bại:', err);
      throw new Error('Gửi lời mời kết bạn thất bại!');
    }

    // 6. Phản hồi client
    return successResponse(
      res,
      { requestId: newRequest._id },
      'Gửi lời mời kết bạn thành công!',
      201
    );
  } catch (error) {
    console.error('❌ Lỗi API gửi lời mời:', error);
    return errorResponse(res, 'Lỗi server', 500, error);
  }
}

//=================== Chấp nhận hoặc từ chối lời mời kết bạn ===================\\
async function acceptFriendRequest(req, res) {
  const { requestId, receiverId, status } = req.body;

  try {
    if (!requestId || !receiverId || !status) {
      return validationError(res, 'Thiếu requestId, receiverId hoặc status');
    }

    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return notFoundError(res, 'Không tìm thấy lời mời kết bạn!');
    }

    if (friendRequest.status !== Status.PENDING) {
      return validationError(res, 'Lời mời đã được xử lý trước đó!');
    }

    const { senderId } = friendRequest;

    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId),
    ]);

    if (!sender || !receiver) {
      return notFoundError(res, 'Người dùng không tồn tại!');
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

    return successResponse(
      res,
      { requestId },
      `Lời mời kết bạn đã được ${status} thành công!`
    );
  } catch (error) {
    console.error('❌ Lỗi API chấp nhận/từ chối lời mời:', error);
    return errorResponse(res, 'Lỗi server', 500, error);
  }
}

//=================== Lấy danh sách lời mời kết bạn ===================\\
async function getFriendRequests(req, res) {
  const { userId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return validationError(res, 'userId không hợp lệ');
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

    return successResponse(
      res,
      {
        total: body.length,
        body: body,
      },
      body.length ? 'Lấy danh sách lời mời thành công' : 'Không có lời mời nào'
    );
  } catch (error) {
    console.error('❌ Lỗi lấy danh sách lời mời:', error);
    return errorResponse(res, 'Lỗi server', 500, error);
  }
}
async function getFriendsListById(req, res) {
  const { userId } = req.params;

  try {
    if (!userId) {
      return validationError(res, 'Thiếu userId');
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return validationError(res, 'userId không hợp lệ');
    }

    const users = await User.findById(userId).populate(
      'friends',
      'id name email avatar'
    );

    if (!users) {
      return validationError(res, 'Không tìm thấy user');
    }

    const body = users.friends.map((user) => formatUploadedBy(user));
    return successResponse(res, {
      body: body,
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách friend', error);
    return errorResponse(res, 'Lỗi server', 500, error);
  }
}

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  getFriendRequests,
  getFriendsListById,
};
