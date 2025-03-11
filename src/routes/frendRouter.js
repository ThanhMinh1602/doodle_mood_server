const express = require("express");
const { sendFriendRequest,respondToFriendRequest } = require("../controllers/friendController");


const router = express.Router();

router.post("/send-friend-request", sendFriendRequest);
router.post("/respond-to-friend-request", respondToFriendRequest);

module.exports = router;