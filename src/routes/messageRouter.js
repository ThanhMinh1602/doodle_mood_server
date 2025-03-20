const express = require('express');
const { sendMessage } = require('../controllers/MessageController');

const router = express.Router();

router.get('/', sendMessage);

module.exports = router;
