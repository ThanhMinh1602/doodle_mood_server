const express = require('express');
const { searchUsers, getUserById,updateUserProfile } = require('../controllers/UserController');

const router = express.Router();

router.get('/search', searchUsers);
router.get('/:id', getUserById);
router.put('/update-profile', updateUserProfile);

module.exports = router;
