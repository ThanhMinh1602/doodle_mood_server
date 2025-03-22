const admin = require('firebase-admin');
const serviceAccount = require('./src/config/key/momentsy-55ac3-firebase-adminsdk-fbsvc-cfcffcac93 copy.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log('✅ Firebase Admin SDK đã được khởi tạo thành công!');
