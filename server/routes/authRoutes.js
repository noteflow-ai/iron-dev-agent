const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile,
  legacyLogin
} = require('../controllers/authController');

// New API routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

// Legacy route for backward compatibility
router.post('/legacy-login', legacyLogin);

module.exports = router;
