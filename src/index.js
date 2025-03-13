require("dotenv").config(); // Load biến môi trường

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const connectDB = require("./config/db"); 
const { initSocket } = require("./services/socketService"); // Import socket service
const authRoutes = require("./routes/authRoutes");
const fileRouter = require("./routes/fileRouters");
const userRouter = require("./routes/userRouter");
const friendRouter = require("./routes/frendRouter");
const messages = require('./routes/chatRouter')

const app = express();

// Kết nối database
connectDB();

// Middleware
app.use(morgan("combined")); 
app.use(cors());
app.use(bodyParser.json());

// Routes API
app.use("/api/auth", authRoutes);
app.use("/api/file", fileRouter);
app.use("/api/user", userRouter);
app.use("/api/friend", friendRouter);
app.use("/api/chat", messages)

// Tạo server HTTP
const server = http.createServer(app);

// Khởi tạo socket
initSocket(server);

// Lắng nghe cổng
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server chạy trên cổng ${PORT}`));
