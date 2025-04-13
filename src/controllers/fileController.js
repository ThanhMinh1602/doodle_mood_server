const fs = require('fs');
const drive = require('../config/googleAuth');
const Image = require('../models/image');
const User = require('../models/user');
const { formatUploadedBy } = require('../utils/formatBody');
const {
  successResponse,
  errorResponse,
  validationError,
  notFoundError,
} = require('../utils/responseUtils');
// Enum-like structure cho fileType
const FileType = Object.freeze({
  AVATAR: 'avatar',
  STORY: 'story',
});


//  Upload file lên Google Drive
async function uploadFileToDrive(filePath, fileName, FileType) {
  // Kiểm tra file có tồn tại không

  const fileMetadata = {
    name: fileName,
    parents: FileType.avatar ? ['UserAvatar'] :  FileType.story ? [] : [], // ID của thư mục trên Google Drive
  };

  const media = {
    mimeType: 'application/octet-stream',
    body: fs.createReadStream(filePath),
  };

  try {
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });

    const fileId = response.data.id;
    console.log('✅ Upload thành công:', fileId);

    // Cấp quyền đọc cho mọi người
    await drive.permissions.create({
      fileId: fileId,
      requestBody: { role: 'reader', type: 'anyone' },
    });

    // Lấy link file
    const result = await drive.files.get({
      fileId: fileId,
      fields: 'id, webViewLink, webContentLink',
    });
    console.log('🔗 Link file:', result);
    // Xóa file sau khi upload xong
    fs.unlinkSync(filePath);

    return {
      success: true,
      fileId: fileId,
      viewLink: result.data.webViewLink,
      downloadLink: result.data.webContentLink,
    };
  } catch (error) {
    console.error('❌ Upload error:', error);
    return { success: false, error: error.message };
  }
}
// Upload file + Lưu thông tin người tải lên
async function uploadFile(req, res) {
  // Kiểm tra xem file có được upload không
  if (!req.file) {
    return validationError(res, 'No file uploaded');
  }

  // Kiểm tra xem có userId không
  if (!req.body.userId) {
    return validationError(res, 'Missing userId');
  }

  // Kiểm tra xem có fileType không (avatar hay story)
  const { fileType } = req.body;
  
  if (!fileType || !Object.values(FileType).includes(fileType)) {
    return validationError(res, `Invalid fileType. It should be one of the following: ${Object.values(FileType).join(', ')}`);
  }

  const { userId } = req.body;
  console.log('📂 File path:', req.file.path);
  console.log('📄 File name:', req.file.originalname);
  console.log('👤 Uploaded by:', userId);
  console.log('📄 File type:', fileType);

  // Gọi hàm uploadFileToDrive, truyền thêm tham số `fileType`
  const result = await uploadFileToDrive(req.file.path, req.file.originalname, fileType);

  if (result.success) {
    try {
      // Tạo mới một document Image trong MongoDB
      const newImage = new Image({
        fileId: result.fileId,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        viewLink: result.viewLink,
        downloadLink: result.downloadLink,
        uploadedBy: userId,
        fileType: fileType,  // Thêm loại file (avatar/story)
      });

      await newImage.save();
      return successResponse(res, { body: newImage }, 'Upload thành công!');
    } catch (error) {
      console.error('❌ Lỗi khi lưu vào MongoDB:', error);
      return errorResponse(res, 'Lỗi khi lưu vào DB', 500, error);
    }
  } else {
    return errorResponse(res, 'Upload thất bại', 500, result.error);
  }
}


// Lấy danh sách hình ảnh của bạn bè và chính user
async function getImages(req, res) {
  try {
    const userId = req.params.userId;

    // Lấy danh sách bạn bè
    const user = await User.findById(userId).select('friends');
    if (!user) {
      return notFoundError(res, 'Người dùng không tồn tại!');
    }

    const friendIds = user.friends.map((friend) => friend.toString());
    friendIds.push(userId);

    // Lọc ảnh theo userId và bạn bè, sắp xếp theo `uploadedAt` giảm dần (mới nhất trước)
    const images = await Image.find({ uploadedBy: { $in: friendIds } })
      .populate('uploadedBy', 'name email avatar')
      .sort({ uploadedAt: -1 }); // sắp xếp giảm dần theo thời gian

    // Định dạng dữ liệu trả về
    const body = images.map((image) => ({
      id: image._id,
      fileId: image.fileId,
      fileName: image.fileName,
      mimeType: image.mimeType,
      viewLink: image.viewLink,
      downloadLink: image.downloadLink,
      uploadedBy: formatUploadedBy(image.uploadedBy),
      uploadedAt: image.uploadedAt.toISOString(),
    }));

    return successResponse(res, {
      total: images.length,
      body: body,
    });
  } catch (error) {
    console.error('❌ Lỗi khi lấy danh sách hình ảnh:', error);
    return errorResponse(res, 'Lỗi server!', 500, error);
  }
}

// Lấy danh sách hình ảnh từ Google Drive
async function getImagesByDrive(req, res) {
  try {
    const response = await drive.files.list({
      q: "mimeType contains 'image/'",
      fields: 'files(id, name, mimeType, webViewLink, webContentLink)',
    });

    const images = response.data.files.map((file) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      viewLink: file.webViewLink,
      downloadLink: file.webContentLink,
    }));

    return successResponse(res, { images });
  } catch (error) {
    console.error('❌ Lỗi khi lấy danh sách hình ảnh từ Drive:', error);
    return errorResponse(res, 'Lỗi server!', 500, error);
  }
}

// Export module
module.exports = {
  uploadFile,
  getImages,
  getImagesByDrive,
  uploadFileToDrive,
};
