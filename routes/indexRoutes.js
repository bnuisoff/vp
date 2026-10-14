const express = require('express');
const router = express.Router();

const {
	index,
	minust,
	vanasona,
} = require('../controllers/indexControllers');

router.route('/').get(index);

router.route('/minust').get(minust);

router.route('/vanasona').get(vanasona);


module.exports = router;