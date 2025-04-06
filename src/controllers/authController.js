const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { sendOTPEmail } = require('../services/emailService');
const { generateOTP, hashOTP, verifyOTP } = require('../utils/otpUtils');
const {
  successResponse,
  errorResponse,
  validationError,
} = require('../utils/responseUtils');

// Hàm kiểm tra dữ liệu đầu vào
const validateInput = (fields) => {
  return fields.every((field) => field && field.trim() !== '');
};

// Đăng ký tài khoản
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!validateInput([name, email, password])) {
      return validationError(res, 'Vui lòng nhập đầy đủ thông tin');
    }

    if (await User.findOne({ email })) {
      return validationError(res, 'Email đã tồn tại');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    return successResponse(res, null, 'Đăng ký thành công', 201);
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    return errorResponse(res, 'Lỗi server', 500, error);
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { email, password, deviceToken } = req.body;
    console.log(req.body);

    if (!validateInput([email, password])) {
      return validationError(res, 'Vui lòng nhập email và mật khẩu');
    }

    const user = await User.findOne({ email });
    if (!user) {
      return validationError(res, 'Sai email hoặc mật khẩu');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return validationError(res, 'Sai email hoặc mật khẩu');
    }

    // Cập nhật deviceToken nếu có
    if (deviceToken) {
      user.deviceToken = deviceToken;
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    return successResponse(
      res,
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
      },
      'Đăng nhập thành công'
    );
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    return errorResponse(res, 'Lỗi server', 500, error);
  }
};

// Quên mật khẩu (Gửi OTP)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!validateInput([email])) {
      return validationError(res, 'Vui lòng nhập email');
    }

    const user = await User.findOne({ email });
    if (!user) {
      return validationError(res, 'Email không tồn tại');
    }

    const otp = generateOTP();
    user.resetOTP = await hashOTP(otp);
    user.resetOTPExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    await sendOTPEmail(email, otp);
    console.log('📧 OTP đã gửi qua email');

    return successResponse(res, null, 'OTP đã được gửi');
  } catch (error) {
    console.error('Lỗi gửi OTP:', error);
    return errorResponse(res, 'Lỗi server', 500, error);
  }
};

// Xác minh OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!validateInput([email, otp])) {
      return validationError(res, 'Thiếu email hoặc OTP');
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetOTP || user.resetOTPExpires < Date.now()) {
      return validationError(res, 'OTP không hợp lệ hoặc đã hết hạn');
    }

    const isOTPValid = await verifyOTP(otp, user.resetOTP);
    if (!isOTPValid) {
      return validationError(res, 'OTP không hợp lệ');
    }
    user.resetOTP = null;
    user.resetOTPExpires = null;
    await user.save();

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '15m',
    });

    return successResponse(res, { resetToken }, 'OTP hợp lệ');
  } catch (error) {
    console.error('Lỗi xác minh OTP:', error);
    return errorResponse(res, 'Lỗi server', 500, error);
  }
};

// Đặt lại mật khẩu
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!validateInput([resetToken, newPassword])) {
      return validationError(res, 'Thiếu token hoặc mật khẩu mới');
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return validationError(res, 'Token đã hết hạn');
      }
      if (error.name === 'JsonWebTokenError') {
        return validationError(res, 'Token không hợp lệ');
      }
      throw error;
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return validationError(res, 'Người dùng không tồn tại');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return successResponse(res, null, 'Mật khẩu đã được đặt lại');
  } catch (error) {
    console.error('Lỗi đặt lại mật khẩu:', error);
    return errorResponse(res, 'Lỗi server', 500, error);
  }
};

exports.logout = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return validationError(res, 'Thiếu userId');
    }

    //xoá deviceToken
    const user = await User.findById(userId);
    if (!user) {
      return validationError(res, 'Người dùng không tồn tại');
    }
    user.deviceToken = null;
    await user.save();

    return successResponse(res, null, 'Đăng xuất thành công');
  } catch (error) {
    console.error('Lỗi đăng xuất:', error);
    return errorResponse(res, 'Lỗi server', 500, error);
  }
};
