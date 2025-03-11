const express = require("express");
const { searchUsers } = require("../controllers/user_controller");

const router = express.Router();

router.get("/search", searchUsers);

module.exports = router;