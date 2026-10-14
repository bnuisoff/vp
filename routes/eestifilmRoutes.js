const express = require('express');
const router = express.Router();

//kasutatavad kontrollerid
const { eestifilm, 
        eestifilminimesed,
        eestifilminimesedAdd,
        eestifilminimesedAddPost,
        eestifilmifilmidAdd,
        eestifilmifilmidAddPost,
        eestifilmiametidAdd,
        eestifilmiametidAddPost,
        eestifilmiseosed,
        eestifilmiseosedAdd,
        eestifilmiseosedAddPost
    } = require('../controllers/eestifilmControllers');

router.route('/').get(eestifilm);

router.route('/eestifilminimesed').get(eestifilminimesed);

router.route('/eestifilminimesed_lisa')
    .get(eestifilminimesedAdd)
    .post(eestifilminimesedAddPost);

router.route('/eestifilmifilmid_lisa')
    .get(eestifilmifilmidAdd)
    .post(eestifilmifilmidAddPost);

router.route('/eestifilmiametid_lisa')
    .get(eestifilmiametidAdd)
    .post(eestifilmiametidAddPost);

    router.route('/eestifilmiseosed').get(eestifilmiseosed);

router.route('/eestifilmiseosed_lisa')
    .get(eestifilmiseosedAdd)
    .post(eestifilmiseosedAddPost);

module.exports = router;