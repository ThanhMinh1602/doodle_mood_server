const FriendRequest = require("../models/FriendRequest");
const User = require("../models/User");
const { sendNotification } = require("../services/socketService");

// Gửi lời mời kết bạn
exports.sendFriendRequest = async (req, res) => {
    try {
        const { senderId, receiverId } = req.body;

        // Kiểm tra nếu hai người đã là bạn bè hoặc đã gửi lời mời trước đó
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId }
            ]
        });

        if (existingRequest) {
            return res.status(400).json({ message: "Bạn đã gửi lời mời hoặc đã là bạn bè" });
        }

        // Tạo lời mời kết bạn
        const newRequest = new FriendRequest({ senderId, receiverId });
        await newRequest.save();

        // Gửi thông báo đến người nhận lời mời kết bạn
        sendNotification(receiverId, "friend_request_received", { senderId });

        res.status(201).json({ message: "Đã gửi lời mời kết bạn", request: newRequest });
    } catch (error) {
        console.error("❌ Lỗi gửi lời mời kết bạn:", error);
        res.status(500).json({ error: "Lỗi server" });
    }
};

// Chấp nhận hoặc từ chối lời mời kết bạn
exports.respondToFriendRequest = async (req, res) => {
    try {
        console.log("📩 Nhận yêu cầu xử lý lời mời kết bạn:", req.body);

        const { requestId, userId, action } = req.body;
        
        if (!requestId || !userId || !action) {
            console.log("❌ Thiếu requestId, userId hoặc action");
            return res.status(400).json({ message: "Thiếu dữ liệu đầu vào" });
        }

        // Tìm lời mời kết bạn
        const friendRequest = await FriendRequest.findById(requestId);
        console.log("🔍 Lời mời tìm thấy:", friendRequest);

        if (!friendRequest) {
            console.log("❌ Không tìm thấy lời mời kết bạn với ID:", requestId);
            return res.status(404).json({ message: "Lời mời không tồn tại" });
        }

        // Kiểm tra xem user có phải là người nhận không
        if (friendRequest.receiverId.toString() !== userId) {
            console.log("❌ User không có quyền xử lý lời mời này");
            return res.status(403).json({ message: "Bạn không có quyền xử lý lời mời này" });
        }
        
        // Xử lý chấp nhận hoặc từ chối
        if (action === "accept") {
            console.log("✅ Chấp nhận lời mời");
            friendRequest.status = "accepted";
        } else if (action === "decline") {
            console.log("❌ Từ chối lời mời");
            friendRequest.status = "declined";
        } else {
            console.log("❌ Hành động không hợp lệ:", action);
            return res.status(400).json({ message: "Hành động không hợp lệ. Action phải là [accept, decline]" });
        }

        await friendRequest.save();

        // Gửi thông báo đến người gửi lời mời
        sendNotification(friendRequest.senderId, "friend_request", { action, userId });
        console.log(`📩 Đã gửi thông báo đến user ${friendRequest.senderId} về kết quả lời mời`);

        res.status(200).json({ message: `Đã ${action} lời mời kết bạn` });
    } catch (error) {
        console.error("❌ Lỗi xử lý lời mời kết bạn:", error);
        res.status(500).json({ error: "Lỗi server" });
    }
};
