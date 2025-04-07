import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    cb(null, `${timestamp}-${file.originalname}`);
  },
});

export default storage;