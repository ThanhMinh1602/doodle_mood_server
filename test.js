const io = require("socket.io-client");

// Kết nối tới server socket
const socket = io("http://localhost:3000", {
    transports: ["websocket"], // Sử dụng WebSocket thay vì polling
});

socket.on("connect", () => {
    console.log("✅ Đã kết nối tới server socket với ID:", socket.id);

    // Gửi một yêu cầu kết bạn
    const friendRequest = {
        senderId: "65b3c1e5f4a1b2c3d4e5f678", // ID giả lập
        receiverId: "65b3c1e5f4a1b2c3d4e5f679", // ID giả lập
    };
    socket.emit("sendFriendRequest", friendRequest);
});

// Lắng nghe sự kiện khi nhận được lời mời kết bạn
socket.on("receiveFriendRequest", (data) => {
    console.log("📩 Nhận lời mời kết bạn từ:", data.senderId);
});

// Lắng nghe sự kiện khi lời mời được chấp nhận
socket.on("friendRequestAccepted", (data) => {
    console.log("✅ Lời mời kết bạn đã được chấp nhận bởi:", data.receiverId);
});

// Xử lý khi mất kết nối
socket.on("disconnect", () => {
    console.log("❌ Mất kết nối với server");
});
