const express = require('express');

const router = express.Router();
const {
  getConversation,
  getConversationList,
} = require('../controllers/MessageController');

router.get('/:user1Id/:user2Id', getConversation);
router.get('/:userId', getConversationList);

module.exports = router;
