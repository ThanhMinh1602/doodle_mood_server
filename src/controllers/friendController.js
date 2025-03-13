const FriendRequest = require("../models/frendRequest");
const User = require("../models/User");
const { sendNotification } = require("../services/socketService");

// Gửi lời mời kết bạn
exports.sendFriendRequest = async (req, res) => {
    try {
        const { senderId, receiverId } = req.body;

        // Kiểm tra nếu đã gửi lời mời hoặc đã là bạn bè
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

        // 🔹 Gửi thông báo WebSocket đến người nhận
        sendNotification(receiverId, {
            event: "receive_friend_request",
            data: {
                senderId,
                message: "Bạn có một lời mời kết bạn mới!"
            }
        });

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
        let responseMessage;
        if (action === "accept") {
            console.log("✅ Chấp nhận lời mời");
            friendRequest.status = "accepted";
            responseMessage = "Lời mời kết bạn đã được chấp nhận!";
            
            // 🔹 Gửi thông báo WebSocket đến người gửi (senderId)
            sendNotification(friendRequest.senderId, {
                event: "friend_request_accepted",
                data: {
                    receiverId: userId,
                    message: "Lời mời kết bạn của bạn đã được chấp nhận!"
                }
            });

        } else if (action === "decline") {
            console.log("❌ Từ chối lời mời");
            friendRequest.status = "declined";
            responseMessage = "Lời mời kết bạn đã bị từ chối.";
            
            // 🔹 Gửi thông báo WebSocket đến người gửi (senderId) (có thể bỏ qua nếu không cần)
            sendNotification(friendRequest.senderId, {
                event: "friend_request_declined",
                data: {
                    receiverId: userId,
                    message: "Lời mời kết bạn của bạn đã bị từ chối."
                }
            });

        } else {
            console.log("❌ Hành động không hợp lệ:", action);
            return res.status(400).json({ message: "Hành động không hợp lệ. Action phải là [accept, decline]" });
        }

        await friendRequest.save();

        res.status(200).json({ message: responseMessage });
    } catch (error) {
        console.error("❌ Lỗi xử lý lời mời kết bạn:", error);
        res.status(500).json({ error: "Lỗi server" });
    }
};
