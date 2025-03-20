const express = require('express');
const {
  sendFriendRequest,
  acceptFriendRequest,
  getFriendRequests,
} = require('../controllers/friendController');

const router = express.Router();

router.post('/send-friend-request', sendFriendRequest);
router.post('/accept-friend-request', acceptFriendRequest);
router.get('/friend-requests/:userId', getFriendRequests);

module.exports = router;
