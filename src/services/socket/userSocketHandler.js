const users = new Map(); // Lưu socketId theo userId

/**
 * Đăng ký người dùng online khi họ gửi userId qua sự kiện 'register'
 * @param {Socket} socket - Đối tượng socket của người dùng
 */
function registerUser(socket) {
    socket.on("register", (userId) => {
        if (!userId) {
            console.error("⚠️ Không có userId khi đăng ký");
            return;
        }

        users.set(userId, socket.id);
        console.log(`🔵 User ${userId} online với socketId: ${socket.id}`);
        
        // Phát sự kiện để thông báo người dùng đã online (tùy chọn)
        socket.broadcast.emit("userOnline", { userId });
    });
}

/**
 * Xử lý khi người dùng ngắt kết nối
 * @param {Socket} socket - Đối tượng socket của người dùng
 */
function handleDisconnect(socket) {
    socket.on("disconnect", () => {
        for (const [userId, socketId] of users.entries()) {
            if (socketId === socket.id) {
                users.delete(userId);
                console.log(`🔴 User ${userId} offline`);
                
                // Phát sự kiện để thông báo người dùng đã offline (tùy chọn)
                socket.broadcast.emit("userOffline", { userId });
                break;
            }
        }
    });
}

/**
 * Lấy socketId của user theo userId
 * @param {string} userId - ID của người dùng
 * @returns {string | undefined} - socketId hoặc undefined nếu không tìm thấy
 */
function getUserSocketId(userId) {
    return users.get(userId);
}

/**
 * Kiểm tra xem user có online hay không
 * @param {string} userId - ID của người dùng
 * @returns {boolean}
 */
function isUserOnline(userId) {
    return users.has(userId);
}

module.exports = { 
    registerUser, 
    handleDisconnect, 
    users, 
    getUserSocketId, 
    isUserOnline 
};