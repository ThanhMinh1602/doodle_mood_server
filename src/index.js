require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const connectDB = require("./config/db");
const { initSocket } = require("./services/socket/socketService");

const app = express();

// Kết nối database
connectDB();

// Middleware
app.use(morgan("combined"));
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/file", require("./routes/fileRouters"));
app.use("/api/user", require("./routes/userRouter"));
app.use("/api/friend", require("./routes/friendRouter"));
app.use("/api/chat", require("./routes/messageRouter"));

// Tạo server và khởi tạo Socket
const server = http.createServer(app);
initSocket(server);

// Khởi động server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server chạy trên cổng ${PORT}`));