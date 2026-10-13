const express = require('express');
const router = express.Router();

const {
	index,
	minust,
	vanasona,
	regvisit,
	regvisitPost,
	visitlog
} = require('../controllers/indexControllers');

router.route('/').get(index);

router.route('/minust').get(minust);

router.route('/vanasona').get(vanasona);

router.route('/regvisit')
	.get(regvisit)
	.post(regvisitPost);

router.route('/visitlog').get(visitlog);

module.exports = router;