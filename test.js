const io = require("socket.io-client");

const socket = io("http://localhost:3000");

socket.on("connect", () => {
    console.log("✅ Kết nối thành công:", socket.id);
    socket.emit("message", { text: "Hello từ client!" });
});

socket.on("message", (data) => {
    console.log("📩 Nhận tin nhắn từ server:", data);
});

socket.on("connect_error", (err) => {
    console.error("❌ Lỗi kết nối:", err.message);
});
