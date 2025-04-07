import multer from 'multer';
import storage from './storage.ts';
import fileFilter from './fileFilter.ts';

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
});

export default upload;
