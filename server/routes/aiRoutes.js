const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { generateContent } = require('../controllers/aiController');

// AI content generation routes
router.post('/generate', protect, generateContent);

module.exports = router;
