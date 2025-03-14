const socketIo = require("socket.io");
const { 
    registerUser, 
    handleDisconnect 
} = require("./userSocketHandler");
const {
    handleSendFriendRequest,
    handleAcceptFriendRequest,
} = require("../../controllers/friendController");

let io;

function initSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("🟢 Người dùng kết nối:", socket.id);

        // Đăng ký user online
        registerUser(socket);

        // Xử lý gửi lời mời kết bạn
        handleSendFriendRequest(socket, io);

        // Xử lý chấp nhận lời mời kết bạn
        handleAcceptFriendRequest(socket, io);

        // Xử lý ngắt kết nối
        handleDisconnect(socket);
    });

    return io;
}

module.exports = { initSocket };