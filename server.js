const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*" }
});

let drawingData = [];

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Gửi dữ liệu vẽ hiện tại cho user mới
    socket.emit("loadDrawing", drawingData);

    // Khi người dùng vẽ
    socket.on("draw", (data) => {
        drawingData.push(data);
        socket.broadcast.emit("draw", data);
    });
    socket.on("clear", () => {
        drawingData = [];
        io.emit("loadDrawing", drawingData);
    });

    // Khi user ngắt kết nối
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

server.listen(3000, () => console.log("✅ Server running on port 3000"));
