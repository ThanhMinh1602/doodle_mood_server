const users = new Map(); // Lưu socketId theo userId

function registerUser(socket) {
    socket.on("register", (userId) => {
        users.set(userId, socket.id);
        console.log(`🔵 User ${userId} online với socketId: ${socket.id}`);
    });
}

function handleDisconnect(socket) {
    socket.on("disconnect", () => {
        for (let [userId, socketId] of users.entries()) {
            if (socketId === socket.id) {
                users.delete(userId);
                console.log(`🔴 User ${userId} offline`);
                break;
            }
        }
    });
}

module.exports = { registerUser, handleDisconnect, users };
