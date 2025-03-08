const { google } = require("googleapis");
require("dotenv").config();

const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_CREDENTIALS,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
});

const drive = google.drive({ version: "v3", auth });

module.exports = drive;
