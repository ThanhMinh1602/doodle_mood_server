const express = require("express");
const { messages } = require("../controllers/MessageController");

const router = express.Router();

router.get("/", messages);

module.exports = router;