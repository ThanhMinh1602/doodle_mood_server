const bcrypt = require("bcryptjs");

// tạo otp ngẫu nhiên 6 số
exports.generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// mã hoá otp 
exports.hashOTP = async (otp) => await bcrypt.hash(otp, 10);

// so sánh otp nhập vào với otp trong db
exports.verifyOTP = async (inputOTP, hashedOTP) => await bcrypt.compare(inputOTP, hashedOTP);
