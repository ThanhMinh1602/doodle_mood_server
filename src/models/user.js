const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        avatar: { type: String, default: null }, // Ảnh đại
        password: { type: String, required: true }, // Ẩn password mặc định
        resetOTP: { type: String, default: null }, // OTP là số
        resetOTPExpires: { type: Date, default: null, index: { expires: "15m" } }, // OTP hết hạn sau 15 phút'    
        friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }] // Danh sách bạn bè
    },
    { timestamps: true } // Tự động thêm createdAt, updatedAt
);

module.exports = mongoose.model("User", UserSchema);
