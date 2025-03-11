const nodemailer = require("nodemailer");
const { getEmailBody } = require("../utils/emailBody");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Mã OTP Đặt Lại Mật Khẩu",
    html: getEmailBody(otp),
  };

  return transporter.sendMail(mailOptions);
};
