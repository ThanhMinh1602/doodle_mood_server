const express = require('express');
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyOTP,
  logout,
} = require('../controllers/authController');
// const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.post('/logout', logout);

module.exports = router;
