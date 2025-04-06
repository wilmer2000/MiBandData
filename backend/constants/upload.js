const multer = require("multer");
const storage = require("./storage");
const fileFilter = require("./fileFilter");

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {fileSize: 10 * 1024 * 1024} // 10MB file size limit
});

module.exports = upload;