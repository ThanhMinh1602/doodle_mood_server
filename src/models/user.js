const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        avatar: { type: String, default: null },
        password: { type: String, required: true },
        resetOTP: { type: String, default: null },
        resetOTPExpires: { type: Date, default: null, index: { expires: "15m" } },
        friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
    },
    { timestamps: true }
);

// Kiểm tra model đã tồn tại trước khi tạo mới
module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
