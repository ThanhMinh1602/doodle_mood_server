const User = require('../models/user');
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query; //lấy keywork từ query string
    if (!query) {
      return res
        .status(400)
        .json({ message: 'Vui lòng nhập từ khoá tìm kiếm' });
    }
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } }, // Tìm theo tên
        { email: { $regex: query, $options: 'i' } }, // Tìm theo email
      ],
    }).select('name email avt');

    res.status(200).json({ users });
  } catch (error) {
    console.error('Lỗi tìm kiếm người dùng:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};
