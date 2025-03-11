const socketIo = require("socket.io");

let io;
const connectedUsers = {}; // Lưu trữ userId -> socketId

const initSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("🔗 Người dùng đã kết nối:", socket.id);

        // Khi user đăng nhập, lưu userId và socketId
        socket.on("user_connected", (userId) => {
            connectedUsers[userId] = socket.id;
            console.log(`✅ User ${userId} đã kết nối với socket ${socket.id}`);
        });

        // Nhận tin nhắn và gửi lại cho tất cả người dùng
        socket.on("message", (data) => {
            console.log("📩 Tin nhắn nhận được:", data);
            io.emit("message", data); // Phát tin nhắn đến tất cả client
        });

        // Khi user ngắt kết nối
        socket.on("disconnect", () => {
            const userId = Object.keys(connectedUsers).find(
                (key) => connectedUsers[key] === socket.id
            );
            if (userId) {
                delete connectedUsers[userId];
                console.log(`❌ User ${userId} đã ngắt kết nối`);
            }
        });
    });
};

// Hàm gửi thông báo đến một user dựa vào userId
const sendNotification = (userId, event, data) => {
    console.log("📡 Danh sách người dùng kết nối:", connectedUsers);

    const socketId = connectedUsers[userId];
    if (socketId && io) {
        io.to(socketId).emit(event, data);
        console.log(`📩 Gửi thông báo cho user ${userId}: ${event}`);
    } else {
        console.error(`❌ Không tìm thấy socket cho user ${userId}`);
    }
};


module.exports = { initSocket, sendNotification, connectedUsers };
