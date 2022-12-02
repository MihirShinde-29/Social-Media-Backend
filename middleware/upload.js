const multer = require("multer");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // console.log(__dirname.split('\\').slice(0, -1).join('/') + '/uploads/')
        cb(null, 'https://ig-clone.onrender.com' + '/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().getTime() + '-' + file.originalname);
    },
});

module.exports = multer({ storage, limits: { fileSize: 1000000 * 5 } }).single("image");