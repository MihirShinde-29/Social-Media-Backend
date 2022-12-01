const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, __dirname.split('\\').slice(0, -1).join('/') + '/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    },
});

module.exports = multer({ storage, limits: { fileSize: 1000000 * 5 } }).single("image");