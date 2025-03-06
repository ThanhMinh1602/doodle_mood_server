const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true }, // Ẩn password mặc định
        resetOTP: { type: Number, default: null }, // OTP là số
        resetOTPExpires: { type: Date, default: null, index: { expires: "15m" } }, // OTP hết hạn sau 15 phút
    },
    { timestamps: true } // Tự động thêm createdAt, updatedAt
);

module.exports = mongoose.model("User", UserSchema);
