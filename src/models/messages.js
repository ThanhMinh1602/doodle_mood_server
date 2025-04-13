const mongoose = require('mongoose');
const moment = require('moment-timezone');

const vietnamTime = moment().tz('Asia/Ho_Chi_Minh').toDate();
const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: { type: String, required: true, trim: true },
  timestamp: { type: Date, default: vietnamTime },
});

module.exports = mongoose.model('Message', messageSchema);
