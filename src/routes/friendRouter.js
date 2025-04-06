const express = require('express');
const {
  sendFriendRequest,
  acceptFriendRequest,
  getFriendRequests,
  getFriendsListById,
} = require('../controllers/friendController');

const router = express.Router();

router.post('/send-friend-request', sendFriendRequest);
router.post('/accept-friend-request', acceptFriendRequest);
router.get('/friend-requests/:userId', getFriendRequests);
router.get('/friend-list/:userId', getFriendsListById);

module.exports = router;
