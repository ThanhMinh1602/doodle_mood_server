const admin = require('firebase-admin');

require('dotenv').config();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      require(process.env.FIREBASE_PRIVATE_KEY)
    ),
  });
}

module.exports = admin;
