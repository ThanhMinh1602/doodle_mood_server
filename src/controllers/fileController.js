const fs = require("fs");
const drive = require("../config/googleAuth");

const Image = require("../models/image");

//  Upload file lên Google Drive
async function uploadFileToDrive(filePath, fileName) {
    const fileMetadata = {
        name: fileName,
        parents: process.env.FOLDER_ID ? [process.env.FOLDER_ID] : [],
    };

    const media = {
        mimeType: "application/octet-stream",
        body: fs.createReadStream(filePath),
    };

    try {
        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: "id",
        });

        const fileId = response.data.id;
        console.log(" Upload thành công:", fileId);

        //  Cấp quyền đọc cho mọi người
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: "reader",
                type: "anyone",
            },
        });

        //  Lấy link file
        const result = await drive.files.get({
            fileId: fileId,
            fields: "id, webViewLink, webContentLink",
        });

        // Xóa file sau khi upload xong
        fs.unlinkSync(filePath);

        return {
            success: true,
            fileId: fileId,
            viewLink: result.data.webViewLink,
            downloadLink: result.data.webContentLink,
        };
    } catch (error) {
        console.error("Upload error:", error);
        return { success: false, error: error.message };
    }
}

//  upload file + Lưu thông tin người tải lên
exports.uploadFile = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    if (!req.body.userId) {
        return res.status(400).json({ message: "Missing userId" });
    }

    const { userId } = req.body;

    console.log("📂 File path:", req.file.path);
    console.log("📄 File name:", req.file.originalname);
    console.log("👤 Uploaded by:", userId);

    const result = await uploadFileToDrive(req.file.path, req.file.originalname);

    if (result.success) {
        try {
            const newImage = new Image({
                fileId: result.fileId,
                fileName: req.file.originalname,
                mimeType: req.file.mimetype,
                viewLink: result.viewLink,
                downloadLink: result.downloadLink,
                uploadedBy: userId,
            });

            await newImage.save();
            return res.json({ success: true, message: "Upload thành công!", image: newImage });
        } catch (error) {
            console.error("Lỗi khi lưu vào MongoDB:", error);
            return res.status(500).json({ success: false, message: "Lỗi khi lưu vào DB" });
        }
    } else {
        return res.status(500).json({ success: false, message: "Upload thất bại" });
    }
};
//Layas data từ mongo
exports.getImages = async (req, res) => {
    try {
        const images = await Image.find().populate("uploadedBy", "name email");

        res.json({ success: true, images });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách hình ảnh:", error);
        res.status(500).json({ success: false, message: "Lỗi server!" });
    }
};

//lấy từ drivedrive
exports.getImagesByDrive = async (req, res) => {
    try {
        const response = await drive.files.list({
            q: "mimeType contains 'image/'",
            fields: "files(id, name, mimeType, webViewLink, webContentLink)",
        });

        const images = response.data.files.map((file) => ({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            viewLink: file.webViewLink,
            downloadLink: file.webContentLink,
        }));

        res.json({ success: true, images });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách hình ảnh:", error);
        res.status(500).json({ success: false, message: "Lỗi server!" });
    }

};
