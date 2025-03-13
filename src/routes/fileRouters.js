const express = require("express");
const multer = require("multer");
const { uploadFile, getImages } = require("../controllers/FileController");

// Đảm bảo thư mục `uploads/` tồn tại
const fs = require("fs");
const path = require("path");
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer
const upload = multer({ dest: uploadDir });

const router = express.Router();

// ✅ Route upload file
router.post("/file-upload", upload.single("file"), uploadFile);

// ✅ Route lấy danh sách hình ảnh
router.get("/list-images", getImages);

module.exports = router;
