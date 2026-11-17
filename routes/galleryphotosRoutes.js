const express = require('express');
const multer = require('multer');
const loginCheck = require('../src/checkLogin.js');

const router = express.Router();

// kontrollime, kas kasutaja on sisse logitud
router.use(loginCheck.isLogin); 

// multer salvestab faili ajutise nimega orig kausta,
// kontroller nimetab selle ümber
const upload = multer({
    dest: 'public/gallery/orig/',
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        const lubatud = ['image/jpeg', 'image/png', 'image/gif'];
        cb(null, lubatud.includes(file.mimetype));
    }
});

const {
    galleryPhotosListGet,
    galleryPhotosUploadGet,
    galleryPhotosUploadPost
} = require('../controllers/galleryPhotosUploadControllers');

router.route('/').get(galleryPhotosListGet);

router.route('/upload').get(galleryPhotosUploadGet);

router.route('/upload').post(upload.single('photoInput'), galleryPhotosUploadPost);

module.exports = router;    