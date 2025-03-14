const socketIo = require("socket.io");
const {sendMessage} = require("../../controllers/MessageController");
const userHandler = require("./userSocketHandler");
const { sendFriendRequest, acceptFriendRequest } = require("../../controllers/FriendController");

let io;
function initSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log("🟢 Người dùng kết nối:", socket.id);

        // Xử lý đăng ký user online
        userHandler.registerUser(socket);

        // Xử lý tin nhắn
        sendMessage(socket, io);

        //xử lý gửi lời mời kết bạn
        sendFriendRequest(socket, io);

        // chấp nhận kết bạn
        acceptFriendRequest(socket, io);

        // Xử lý ngắt kết nối
        userHandler.handleDisconnect(socket);
    });
}

module.exports = { initSocket };
