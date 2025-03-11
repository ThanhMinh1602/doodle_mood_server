const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendOTPEmail } = require("../services/emailService");
const { generateOTP, hashOTP, verifyOTP } = require("../utils/otpUtils");

// Hàm kiểm tra dữ liệu đầu vào
const validateInput = (fields) => {
  return fields.every((field) => field && field.trim() !== "");
};

// Đăng ký tài khoản
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!validateInput([name, email, password])) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "Đăng ký thành công" });
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  try {

    const { email, password } = req.body;

    if (!validateInput([email, password])) {
      return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Sai email hoặc mật khẩu" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Sai email hoặc mật khẩu" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

// Quên mật khẩu (Gửi OTP)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!validateInput([email])) {
      return res.status(400).json({ message: "Vui lòng nhập email" });
    }

    const user = await User.findOne({ email });
    if (!user) {
  
      return res.status(400).json({ message: "Email không tồn tại" });
    }

    const otp = generateOTP();
    user.resetOTP = await hashOTP(otp);
    user.resetOTPExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    await sendOTPEmail(email, otp);
    console.log("📧 OTP đã gửi qua email");

    res.status(200).json({ message: "OTP đã được gửi" });
  } catch (error) {
    console.error("Lỗi gửi OTP:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

// Xác minh OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!validateInput([email, otp])) {
      return res.status(400).json({ message: "Thiếu email hoặc OTP" });
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetOTP || user.resetOTPExpires < Date.now()) {
      return res.status(400).json({ message: "OTP không hợp lệ hoặc đã hết hạn" });
    }

    const isOTPValid = await verifyOTP(otp, user.resetOTP);
    if (!isOTPValid) {
      return res.status(400).json({ message: "OTP không hợp lệ" });
    }
    user.resetOTP = null;
    user.resetOTPExpires = null;
    await user.save();

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });

    res.status(200).json({ message: "OTP hợp lệ", resetToken });
  } catch (error) {
    console.error("Lỗi xác minh OTP:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

// Đặt lại mật khẩu
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!validateInput([resetToken, newPassword])) {
      return res.status(400).json({ message: "Thiếu token hoặc mật khẩu mới" });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(400).json({ message: "Token đã hết hạn" });
      }
      if (error.name === "JsonWebTokenError") {
        return res.status(400).json({ message: "Token không hợp lệ" });
      }
      throw error;
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(400).json({ message: "Người dùng không tồn tại" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Mật khẩu đã được đặt lại" });
  } catch (error) {
    console.error("Lỗi đặt lại mật khẩu:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};
