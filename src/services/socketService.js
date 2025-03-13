const socketIo = require("socket.io");
const Message = require("../models/messages")

let io;
const users = new Map(); // Lưu socketId theo userId
function initSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: "*",
        }
    });

    io.on("connection", (socket) => {
        console.log("🟢 Người dùng kết nối:", socket.id);

        // Đăng ký user online
        socket.on("register", (userId) => {
            users.set(userId, socket.id);
            console.log(`🔵 User ${userId} online với socketId: ${socket.id}`);
        });

        // Xử lý gửi tin nhắn

        socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
            const receiverSocketId = users.get(receiverId);
            
            // Lưu tin nhắn vào MongoDB
            const newMessage = new Message({ senderId, receiverId, message });
            await newMessage.save();
        
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("receiveMessage", { senderId, message });
                console.log(`📩 Tin nhắn từ ${senderId} đến ${receiverId}: ${message}`);
            } else {
                console.log(`⚠️ User ${receiverId} hiện không online.`);
            }
        });

        // Ngắt kết nối
        socket.on("disconnect", () => {
            for (let [userId, socketId] of users.entries()) {
                if (socketId === socket.id) {
                    users.delete(userId);
                    console.log(`🔴 User ${userId} offline`);
                    break;
                }
            }
        });
    });
}

module.exports = { initSocket };
