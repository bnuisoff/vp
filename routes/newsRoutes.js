const express = require('express');
const multer = require('multer');
const router = express.Router();

const upload = multer({
	dest: 'public/news/orig/',
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		const lubatud = ['image/jpeg', 'image/png', 'image/gif'];
		if (!lubatud.includes(file.mimetype)) {
			req.fileTypeError = true; // et kontroller saaks kasutajale öelda, miks pilti ei võetud
		}
		cb(null, lubatud.includes(file.mimetype));
	}
});

const { newsListGet, addNewsPage, addNewsPost } = require('../controllers/newsControllers');

router.route('/').get(newsListGet);

router.route('/addnews')
	.get(addNewsPage)
	.post(upload.single('photoInput'), addNewsPost);

module.exports = router;