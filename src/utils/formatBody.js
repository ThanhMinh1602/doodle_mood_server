// utils.js
// chuẩn hoá dữ liệu người tải lên
function formatUploadedBy(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
  };
}
// chuẩn hóa dữ liệu lời mời kết bạn
const formatFriendRequest = (request) => ({
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
});

module.exports = { formatUploadedBy, formatFriendRequest };
