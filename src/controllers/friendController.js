const FriendRequest = require("../models/frendRequest"); 
const { users } = require("../services/socket/userSocketHandler"); // Lấy danh sách user online

async function sendFriendRequest(socket, io) {
    socket.on("sendFriendRequest", async ({ senderId, receiverId }) => {
        try {
            const receiverSocketId = users.get(receiverId);

            // Kiểm tra xem đã có lời mời kết bạn chưa
            const existingRequest = await FriendRequest.findOne({ senderId, receiverId, status: "pending" });
            if (existingRequest) {
                console.log(`⚠️ Lời mời kết bạn từ ${senderId} đến ${receiverId} đã tồn tại.`);
                return;
            }

            // Lưu yêu cầu kết bạn vào MongoDB
            const newFriendRequest = new FriendRequest({ senderId, receiverId });
            await newFriendRequest.save();

            if (receiverSocketId) {
                io.to(receiverSocketId).emit("receiveFriendRequest", { senderId, receiverId });
                console.log(`📩 Yêu cầu kết bạn từ ${senderId} đến ${receiverId}`);
            } else {
                console.log(`⚠️ Người dùng ${receiverId} không online, yêu cầu sẽ được lưu.`);
            }
        } catch (error) {
            console.error("❌ Lỗi khi gửi yêu cầu kết bạn:", error);
        }
    });
}

async function acceptFriendRequest(socket, io) {
    socket.on("acceptFriendRequest", async ({ requestId, receiverId }) => {
        try {
            const friendRequest = await FriendRequest.findById(requestId);

            if (!friendRequest) {
                console.log("❌ Không tìm thấy lời mời kết bạn.");
                return;
            }

            if (friendRequest.status !== "pending") {
                console.log("⚠️ Lời mời kết bạn đã được xử lý trước đó.");
                return;
            }

            // Cập nhật trạng thái thành "accepted"
            friendRequest.status = "accepted";
            await friendRequest.save();

            const senderSocketId = users.get(friendRequest.senderId);
            if (senderSocketId) {
                io.to(senderSocketId).emit("friendRequestAccepted", { 
                    senderId: friendRequest.senderId, 
                    receiverId: friendRequest.receiverId 
                });
                console.log(`✅ ${receiverId} đã chấp nhận lời mời kết bạn từ ${friendRequest.senderId}`);
            }

        } catch (error) {
            console.error("❌ Lỗi khi chấp nhận lời mời kết bạn:", error);
        }
    });
}

async function getFriendRequests(req, res) {
    try {
        const { userId } = req.params;

        // Kiểm tra userId có hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "❌ userId không hợp lệ" });
        }

        // Lấy danh sách lời mời kết bạn của userId
        const requests = await FriendRequest.find({ receiverId: userId, status: "pending" })
            .populate("senderId", "username email avatar"); // Lấy thêm thông tin người gửi

        if (requests.length === 0) {
            return res.status(200).json({ message: "📭 Không có lời mời kết bạn nào", requests: [] });
        }

        res.status(200).json({ message: "✅ Lấy danh sách lời mời thành công", requests });
    } catch (error) {
        console.error("❌ Lỗi khi lấy danh sách lời mời:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
}

module.exports = { sendFriendRequest, acceptFriendRequest ,getFriendRequests};