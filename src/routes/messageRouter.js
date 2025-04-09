const express = require('express');

const router = express.Router();
const { getConversation } = require('../controllers/MessageController');

router.get('/:user1Id/:user2Id', getConversation);

module.exports = router;
