const express = require('express');
const { searchUsers, getUserById } = require('../controllers/UserController');

const router = express.Router();

router.get('/search', searchUsers);
router.get('/:id', getUserById);

module.exports = router;
