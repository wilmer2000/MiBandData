import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create upload directory
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create a batch directory for this upload
    const batchId = `batch-${Date.now()}-${uuidv4()}`;
    const batchDir = path.join(uploadDir, batchId);

    // Store batch ID on request
    req.batchId = batchId;

    // Create directory
    if (!fs.existsSync(batchDir)) {
      fs.mkdirSync(batchDir, { recursive: true });
    }

    cb(null, batchDir);
  },
  filename: (req, file, cb) => {
    // Keep original filename
    cb(null, file.originalname);
  },
});

// Filter for CSV files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

// Initialize multer for CSV uploads
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 20, // Max 20 files per batch
  },
});

// Middleware to handle multiple files
const handleMultipleFiles = (req, res, next) => {
  upload.array('csvFiles', 20)(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            status: 'error',
            message: 'File too large. Maximum size is 50MB',
            timestamp: '2025-04-07 02:17:31',
            user: 'wilmer2000',
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            status: 'error',
            message: 'Too many files. Maximum is 20 files per upload',
            timestamp: '2025-04-07 02:17:31',
            user: 'wilmer2000',
          });
        }
        return res.status(400).json({
          status: 'error',
          message: `Upload error: ${err.message}`,
          timestamp: '2025-04-07 02:17:31',
          user: 'wilmer2000',
        });
      }

      return res.status(500).json({
        status: 'error',
        message: `Server error: ${err.message}`,
        timestamp: '2025-04-07 02:17:31',
        user: 'wilmer2000',
      });
    }

    // No files uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No CSV files uploaded',
        timestamp: '2025-04-07 02:17:31',
        user: 'wilmer2000',
      });
    }

    next();
  });
};

export default handleMultipleFiles;