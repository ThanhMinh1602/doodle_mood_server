const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  fileId: { type: String, required: true }, // ID trên Google Drive
  fileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  viewLink: { type: String, required: true },
  downloadLink: { type: String, required: true },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }, // Liên kết với User
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Image', imageSchema);
