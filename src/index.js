require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const connectDB = require('./config/db');
const { initSocket } = require('./services/sockets/index');
const os = require('os');


const app = express();
// Kết nối database
connectDB();

// Middleware
app.use(morgan('combined'));
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/file', require('./routes/fileRouters'));
app.use('/api/user', require('./routes/userRouter'));
app.use('/api/friend', require('./routes/friendRouter'));
app.use('/api/chat', require('./routes/messageRouter'));

// Socket

// Tạo server và khởi tạo Socket
const server = http.createServer(app);
const io = initSocket(server);
app.set('io', io);

// Khởi động server
const PORT = process.env.PORT || 3000;
const interfaces = os.networkInterfaces();

// Tìm địa chỉ IP cục bộ
function getLocalExternalIP() {
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalExternalIP();
server.listen(PORT, () => {
    console.log(`🚀 Server chạy tại: http://${localIP}:${PORT}`);
  });
