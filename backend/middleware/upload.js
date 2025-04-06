const multer = require('multer');
const upload = require("../constants/upload");

// Upload middleware that handles errors
const uploadMiddleware = (fieldName) => {
    return (req, res, next) => {
        const uploadSingle = upload.single(fieldName);

        uploadSingle(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                console.error(`Upload error: ${err.message}`);
                return res.status(400).json({
                    message: `File upload error: ${err.message}`,
                    details: `Expected field name: '${fieldName}'`,
                    timestamp: '2025-04-06 01:07:58',
                    user: 'wilmer2000'
                });
            } else if (err) {
                console.error(`General error during upload: ${err.message}`);
                return res.status(500).json({
                    message: 'Server error during file upload',
                    error: err.message,
                    timestamp: '2025-04-06 01:07:58',
                    user: 'wilmer2000'
                });
            }

            // No file uploaded
            if (!req.file) {
                return res.status(400).json({
                    message: 'No file uploaded or file is not a CSV',
                    timestamp: '2025-04-06 01:07:58',
                    user: 'wilmer2000'
                });
            }

            next();
        });
    };
};

module.exports = {
    uploadMiddleware
};

