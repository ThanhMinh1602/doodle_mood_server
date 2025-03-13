const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },P
});

app.use(cors());
app.use(express.json());

let users = {}; // Lưu socketId của người dùng đang online

// Khi một user kết nối
io.on("connection", (socket) => {
    console.log(`🟢 Người dùng ${socket.id} đã kết nối`);

    // Khi user đăng nhập, lưu socketId
    socket.on("user_online", (userId) => {
        users[userId] = socket.id;
        console.log(`🔵 User ${userId} online với socketId: ${socket.id}`);
    });

    // Khi gửi yêu cầu kết bạn
    socket.on("send_friend_request", ({ senderId, receiverId }) => {
        console.log(`📩 User ${senderId} gửi lời mời kết bạn tới ${receiverId}`);
        console.log("🔍 Danh sách online:", users);
        // Nếu người nhận đang online, gửi thông báo ngay
        if (users[receiverId]) {
            io.to(users[receiverId]).emit("receive_friend_request", { senderId });
        }
    });

    // Khi chấp nhận lời mời kết bạn
    socket.on("accept_friend_request", ({ senderId, receiverId }) => {
        console.log(`✅ User ${receiverId} chấp nhận lời mời của ${senderId}`);

        // Thông báo cho người gửi lời mời
        if (users[senderId]) {
            io.to(users[senderId]).emit("friend_request_accepted", { receiverId });
        }
    });

    // Khi user ngắt kết nối
    socket.on("disconnect", () => {
        console.log(`🔴 Người dùng ${socket.id} đã ngắt kết nối`);
        // Xóa user khỏi danh sách online
        for (const userId in users) {
            if (users[userId] === socket.id) {
                delete users[userId];
                break;
            }
        }
    });
});

// Khởi động server
server.listen(3000, () => {
    console.log("🚀 Server chạy tại http://localhost:3000");
});
