require('dotenv').config();
const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function listFiles() {
  try {
    const response = await drive.files.list({
      q: process.env.FOLDER_ID ? `'${process.env.FOLDER_ID}' in parents` : '',
      fields: 'files(id, name, parents, webViewLink, webContentLink)',
    });

    console.log('📂 Danh sách file trong Drive:');
    response.data.files.forEach((file) => {
      console.log(`🆔 ID: ${file.id}`);
      console.log(`📄 Tên: ${file.name}`);
      console.log(`🔗 Xem: ${file.webViewLink}`);
      console.log(`📥 Tải: ${file.webContentLink}\n`);
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách file:', error.message);
  }
}

async function deleteAllImages() {
  try {
    // 🔍 Lấy danh sách tất cả file ảnh trong thư mục Drive
    const response = await drive.files.list({
      q: process.env.FOLDER_ID
        ? `'${process.env.FOLDER_ID}' in parents and mimeType contains 'image/'`
        : "mimeType contains 'image/'",
      fields: 'files(id, name)',
    });

    const files = response.data.files;

    if (!files.length) {
      console.log('✅ Không có ảnh nào để xóa.');
      return;
    }

    // 🗑 Xóa từng file ảnh
    for (const file of files) {
      await drive.files.delete({ fileId: file.id });
      console.log(`🗑 Đã xóa: ${file.name} (ID: ${file.id})`);
    }

    console.log('✅ Đã xóa tất cả ảnh thành công!');
  } catch (error) {
    console.error('❌ Lỗi khi xóa ảnh:', error.message);
  }
}

deleteAllImages();
listFiles();
