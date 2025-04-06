const admin = require('../../config/firebaseAdmin');

const MessagingType = Object.freeze({
  sendFriendRequest: 'sendFriendRequest',
  acceptFriendRequest: 'acceptFriendRequest',
});
// Gửi thông báo đẩy qua Firebase Cloud Messaging(FCM)
async function sendNotification(deviceToken, title, body) {
  if (!deviceToken) return;

  const message = {
    notification: { title, body },
    token: deviceToken,
  };

  try {
    await admin.messaging().send(message);
    console.log(`📩 Thông báo FCM đã được gửi: ${title} - ${body}`);
  } catch (error) {
    console.error('❌ Lỗi gửi thông báo FCM:', error);
  }
}

// Gửi thông báo đẩy với dữ liệu tùy chỉnh và loại thông báo
module.exports = { sendNotification, MessagingType };
