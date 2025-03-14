const Message = require("../models/messages");
const { users } = require("../services/socket/userSocketHandler"); // Lấy danh sách user online

async function sendMessage(socket, io) {
    socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
        const receiverSocketId = users.get(receiverId);

        // Lưu tin nhắn vào MongoDB
        const newMessage = new Message({ senderId, receiverId, message });
        await newMessage.save();

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("receiveMessage", { senderId, receiverId, message });
            console.log(`📩 Tin nhắn từ ${senderId} đến ${receiverId}: ${message}`);
        } else {
            console.log(`⚠️ User ${receiverId} hiện không online.`);
        }
    });
}

module.exports = { sendMessage };
