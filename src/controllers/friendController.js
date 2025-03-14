const FriendRequest = require("../models/frendRequest");
const { getUserSocketId, isUserOnline } = require("../services/socket/userSocketHandler");
const mongoose = require("mongoose");

// Gửi lời mời kết bạn qua Socket
function handleSendFriendRequest(socket, io) {
    socket.on("sendFriendRequest", async ({ senderId, receiverId }) => {
        try {
            if (!senderId || !receiverId) {
                throw new Error("Thiếu senderId hoặc receiverId");
            }

            const senderSocketId = getUserSocketId(senderId);

            // Kiểm tra lời mời trùng lặp
            const existingRequest = await FriendRequest.findOne({
                senderId,
                receiverId,
                status: "pending",
            });
            if (existingRequest) {
                return io.to(senderSocketId).emit("friendRequestStatus", {
                    status: "error",
                    message: "Bạn đã gửi lời mời trước đó!",
                });
            }

            // Tạo và lưu lời mời kết bạn
            const newFriendRequest = new FriendRequest({ senderId, receiverId });
            await newFriendRequest.save();

            // Thông báo tới người nhận nếu online
            const receiverSocketId = getUserSocketId(receiverId);
            if (isUserOnline(receiverId)) {
                io.to(receiverSocketId).emit("receiveFriendRequest", {
                    senderId,
                    receiverId,
                    requestId: newFriendRequest._id,
                });
                console.log(`📩 Yêu cầu kết bạn từ ${senderId} đến ${receiverId}`);
            } else {
                console.log(`⚠️ Người dùng ${receiverId} không online`);
            }

            // Phản hồi người gửi
            io.to(senderSocketId).emit("friendRequestStatus", {
                status: "success",
                message: "Gửi lời mời kết bạn thành công!",
            });
        } catch (error) {
            console.error("❌ Lỗi gửi lời mời kết bạn:", error.message);
            io.to(getUserSocketId(senderId)).emit("friendRequestStatus", {
                status: "error",
                message: "Lỗi khi gửi lời mời kết bạn!",
            });
        }
    });
}

// Chấp nhận lời mời kết bạn qua Socket
function handleAcceptFriendRequest(socket, io) {
    socket.on("acceptFriendRequest", async ({ requestId, receiverId }) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(requestId)) {
                throw new Error("requestId không hợp lệ");
            }

            const friendRequest = await FriendRequest.findById(requestId);
            if (!friendRequest) {
                throw new Error("Không tìm thấy lời mời kết bạn");
            }
            if (friendRequest.status !== "pending") {
                throw new Error("Lời mời đã được xử lý trước đó");
            }

            // Cập nhật trạng thái
            friendRequest.status = "accepted";
            await friendRequest.save();

            // Thông báo tới người gửi nếu online
            const senderSocketId = getUserSocketId(friendRequest.senderId);
            if (isUserOnline(friendRequest.senderId)) {
                io.to(senderSocketId).emit("friendRequestAccepted", {
                    senderId: friendRequest.senderId,
                    receiverId,
                });
                console.log(`✅ ${receiverId} đã chấp nhận lời mời từ ${friendRequest.senderId}`);
            }
        } catch (error) {
            console.error("❌ Lỗi chấp nhận lời mời:", error.message);
            io.to(getUserSocketId(receiverId)).emit("friendRequestStatus", {
                status: "error",
                message: error.message,
            });
        }
    });
}

// API: Gửi lời mời kết bạn (HTTP) - Giữ nguyên như trước
async function sendFriendRequest(req, res) {
    const { senderId, receiverId } = req.body;

    try {
        if (!senderId || !receiverId) {
            return res.status(400).json({ message: "Thiếu senderId hoặc receiverId" });
        }

        const existingRequest = await FriendRequest.findOne({
            senderId,
            receiverId,
            status: "pending",
        });
        if (existingRequest) {
            return res.status(400).json({ message: "Bạn đã gửi lời mời trước đó!" });
        }

        const newFriendRequest = new FriendRequest({ senderId, receiverId });
        await newFriendRequest.save();

        res.status(201).json({
            message: "Gửi lời mời kết bạn thành công!",
            requestId: newFriendRequest._id,
        });
    } catch (error) {
        console.error("❌ Lỗi API gửi lời mời:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
}

// API: Chấp nhận lời mời kết bạn (HTTP) - Giữ nguyên như trước
async function acceptFriendRequest(req, res) {
    const { requestId } = req.body;

    try {
        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({ message: "requestId không hợp lệ" });
        }

        const friendRequest = await FriendRequest.findById(requestId);
        if (!friendRequest) {
            return res.status(404).json({ message: "Không tìm thấy lời mời kết bạn" });
        }
        if (friendRequest.status !== "pending") {
            return res.status(400).json({ message: "Lời mời đã được xử lý trước đó" });
        }

        friendRequest.status = "accepted";
        await friendRequest.save();

        res.status(200).json({ message: "Chấp nhận lời mời kết bạn thành công!" });
    } catch (error) {
        console.error("❌ Lỗi API chấp nhận lời mời:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
}

// API: Lấy danh sách lời mời kết bạn - Giữ nguyên như trước
async function getFriendRequests(req, res) {
    const { userId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "userId không hợp lệ" });
        }

        const requests = await FriendRequest.find({
            receiverId: userId,
            status: "pending",
        }).populate("senderId", "id name email avatar");

        // Thay đổi key senderId -> senderBy
        const body = requests.map(request => ({
            id: request._id,
            senderBy: request.senderId ? {
                id: request.senderId._id,
                name: request.senderId.name, 
                email: request.senderId.email,
                avatar: request.senderId.avatar
            } : null,
            receiverId: request.receiverId,
            status: request.status,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt,
          
        }));

        res.status(200).json({
            message: body.length ? "Lấy danh sách lời mời thành công" : "Không có lời mời nào",
            body,
        });
    } catch (error) {
        console.error("❌ Lỗi lấy danh sách lời mời:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
}

module.exports = {
    handleSendFriendRequest,
    handleAcceptFriendRequest,
    sendFriendRequest,
    acceptFriendRequest,
    getFriendRequests,
};