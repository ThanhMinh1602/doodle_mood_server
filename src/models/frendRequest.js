const mongoose = require('mongoose');

const FriendRequestSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }, // Người gửi lời mời
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }, // Người nhận lời mời
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    }, // Trạng thái: Chờ duyệt, Đã chấp nhận, Đã từ chối
  },
  { timestamps: true } // Tự động tạo createdAt và updatedAt
);

module.exports = mongoose.model('FriendRequest', FriendRequestSchema);
