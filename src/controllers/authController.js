const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const nodemailer = require("nodemailer");
// hế lô mặt lol, đọc kĩ chú thích nhé, ngu tiếng anh nên đọc đỡ tiếng việt nhỉ =))
// đăng ký tài khoản
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email }); //tìm kiếm email trong databse

    if (userExists) return res.status(400).json({ message: "Email đã tồn tại" }); //email tồn tại thì trả về 1 response với status code là 400 và một cái thông báo 

    const hashedPassword = await bcrypt.hash(password, 10); // hóa mật khẩu với thư viện bcrypt
    const newUser = new User({ name, email, password: hashedPassword }); // tạo người dùng mới
    await newUser.save(); // lưu mặt lol bào đó vào db

    res.status(201).json({ message: "Đăng ký thành công" }); // trả về phản hồi thành công
  } catch (error) {
    res.status(500).json({ error: "Đã có lỗi xảy ra" }); // bắt lỗi nếu xui xui
  }
};

//  đăng nhập
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body; // như trên
    const user = await User.findOne({ email }); // như trên lun 

    if (!user) return res.status(400).json({ message: "Tài khoản không tồn tại" }); /// như trêntrên

    const isMatch = await bcrypt.compare(password, user.password); // sso sánh mật khẩu nhập vào với mật khẩu trong database
    if (!isMatch) return res.status(400).json({ message: "Mật khẩu không đúng" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" }); // ttạo JWT token với thời gian hết hạn 1 giờ
    res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email } }); // trả về token và thông tin người dùng để bên fe biết đó là thằng mặt l nào
  } catch (error) {
    res.status(500).json({ error: "Đã có lỗi xảy ra" }); //như trên
  }
};

// quên mật khẩu
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "Email không tồn tại" });

    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // random otp 4 số
    user.resetOTP = otp; // Lưu OTP vào user
    user.resetOTPExpires = Date.now() + 15 * 60 * 1000; // đặt time hết hạn cho OTP là 15 phút(Công thức ni e search gg đừng thắc mắc tội ee
    await user.save();

    // cấucấu hình gửi email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // nội dung email gửi đi
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Đặt lại mật khẩu",
      html: `<p>Mã OTP của bạn: <strong>${otp}</strong></p><p>OTP có hiệu lực trong 15 phút.</p>`
    };

    await transporter.sendMail(mailOptions); // send email chứa OTP
    res.status(200).json({ message: "OTP đã được gửi đến email của bạn" });
  } catch (error) {
    res.status(500).json({ error: "Đã có lỗi xảy ra" });
  }
};

//đặt lại mật khẩu
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "Email không tồn tại" });
    if (!user.resetOTP || user.resetOTP !== otp) return res.status(400).json({ message: "OTP không hợp lệ hoặc đã hết hạn" }); // Kiểm tra OTP
    if (user.resetOTPExpires < Date.now()) return res.status(400).json({ message: "OTP đã hết hạn" }); // Kiểm tra thời gian hết hạn OTP

    user.password = await bcrypt.hash(newPassword, 10); // mã hóa mật khẩu mới
    user.resetOTP = null; // xóa OTP sau khi sử dụng
    user.resetOTPExpires = null;
    await user.save(); // lưu lại mật khẩu mới vào database

    res.status(200).json({ message: "Mật khẩu đã được đặt lại thành công" });
  } catch (error) {
    res.status(500).json({ error: "Đã có lỗi xảy ra" });
  }
};
