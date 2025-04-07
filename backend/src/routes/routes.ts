import express from 'express';
import csvController from '../controllers/csvController';
import handleMultipleFiles from '../middleware/upload';

const router = express.Router();

// Routes for CSV processing
router.post('/process', handleMultipleFiles, csvController.importCsvFiles);

export default router;