const User = require('../models/user');
const {
  successResponse,
  errorResponse,
  validationError,
} = require('../utils/responseUtils');

exports.searchUsers = async (req, res) => {
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
};
