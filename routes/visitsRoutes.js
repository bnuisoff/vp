const express = require('express');
const router = express.Router();

const { visits, regvisit, regvisitPost } = require('../controllers/visitsControllers');

router.route('/').get(visits);

router.route('/regvisit')
	.get(regvisit)
	.post(regvisitPost);

module.exports = router;