const User = require('../models/user');
const {
  successResponse,
  errorResponse,
  validationError,
} = require('../utils/responseUtils');
const { formatUploadedBy } = require('../utils/formatBody');
const { uploadFileToDrive } = require('./fileController');

async function searchUsers(req, res) {
  try {
    const { query } = req.query; //lấy keywork từ query string
    if (!query) {
      return validationError(res, 'Vui lòng nhập từ khoá tìm kiếm');
    }
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } }, // Tìm theo tên
        { email: { $regex: query, $options: 'i' } }, // Tìm theo email
      ],
    }).select('name email avt');

    return successResponse(res, { users });
  } catch (error) {
    console.error('Lỗi tìm kiếm người dùng:', error);
    return errorResponse(res, 'Lỗi server', 500, error);
  }
}
async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    const userFormat = formatUploadedBy(user);
    return successResponse(res, userFormat);
  } catch (error) {
    console.error('Lỗi lấy thông tin người dùng:', error);
    return errorResponse(res, 'Lỗi server', 500, error);
  }

}
// Cập nhật thông tin người dùng
async function updateUserProfile(req, res) {
  try {
    const { userId, name, email, avatar } = req.body;

    // Kiểm tra xem người dùng có tồn tại không
    const user = await User.findById(userId);
    if (!user) {
      return validationError(res, 'Người dùng không tồn tại');
    }
   
    // Cập nhật thông tin người dùng
    user.name = name || user.name;
    user.email = email || user.email;
    user.avatar = avatar || user.avatar;
   
    await user.save();

    return successResponse(res, { user });
  } catch (error) {
    console.error('Lỗi cập nhật thông tin người dùng:', error);
    return errorResponse(res, 'Lỗi server', 500, error);
  }
}

module.exports = {
  searchUsers,
  getUserById,
  updateUserProfile
};
