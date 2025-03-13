const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    senderId: { type: String, required: true },  // 👈 Required
    senderId: { type: String, required: true }, // 👈 Required
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Message", messageSchema);
