const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ message: "Không có token, truy cập bị từ chối" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Gán thông tin user vào request
    next();
  } catch (error) {
    res.status(401).json({ message: "Token không hợp lệ" });
  }
};
