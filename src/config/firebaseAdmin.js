const admin = require('firebase-admin');

require('dotenv').config();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      require('./key/momentsy-55ac3-firebase-adminsdk-fbsvc-cfcffcac93.json')
    ),
  });
}

module.exports = admin;
