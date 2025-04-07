const express = require('express');
const router = express.Router();
const csvController = require('../controllers/csvController');
const { uploadMiddleware } = require('../middleware/upload');

// Routes for CSV processing
router.post('/process', uploadMiddleware('csv'), csvController.processCsv);

module.exports = router;