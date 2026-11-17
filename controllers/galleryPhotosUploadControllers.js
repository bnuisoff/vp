const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');


const dbConf = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
};


const origDir = path.join(__dirname, '..', process.env.UPLOAD_ORIGINAL_PATH);
const normalDir = path.join(__dirname, '..', process.env.UPLOAD_RESIZED_PATH);
const thumbDir = path.join(__dirname, '..', process.env.UPLOAD_THUMBNAIL_PATH);
const watermarkFile = path.join(__dirname, '..', 'public', 'pic', 'watermark.png');


//@desc all photos page
//@route GET /galleryphotos
//@access public
const galleryPhotosListGet = async (req, res) => {
    let conn;
    try {
        conn = await mysql.createConnection(dbConf);
        const [photos] = await conn.execute(
    'SELECT id, filename, alttext FROM galleryphotos WHERE privacy >= 2 AND deleted IS NULL ORDER BY id DESC'        );
        res.render('galleryphotos', { photos: photos });
    } catch (err) {
        console.error(err);
        res.render('galleryphotos', { photos: [] });
    } finally {
        if (conn) await conn.end();
    }
};

//@desc photo upload page
//@route GET /galleryphotos/upload
//@access public
const galleryPhotosUploadGet = (req, res) => {
    res.render('galleryphotoupload', { notice: '' });
};

//@desc photo upload
//@route POST /galleryphotos/upload
//@access public
const galleryPhotosUploadPost = async (req, res) => {
    let conn;
    try {
        if (!req.file) {
            return res.render('galleryphotoupload', { notice: 'Pilt on valimata või failitüüp ei sobi (lubatud JPG, PNG, GIF).' });
        }

        // uus failinimi ja ümbernimetamine orig kaustas
        const fileName = 'vp_' + Date.now() + path.extname(req.file.originalname).toLowerCase();
        const origPath = path.join(origDir, fileName);
        await fs.rename(req.file.path, origPath);

        // vesimärk väikseks (100 px lai)
        const watermark = await sharp(watermarkFile).resize({ width: 100 }).toBuffer();

        // keskmise suurusega pilt vesimärgiga paremas alanurgas
        await sharp(origPath, { animated: true })
            .resize(800, 600, { fit: 'inside' })
            .composite([{ input: watermark, gravity: 'southeast' }])
            .toFile(path.join(normalDir, fileName));

        // pisipilt (ilma vesimärgita)
        await sharp(origPath, { animated: true })
            .resize(200, 200)
            .toFile(path.join(thumbDir, fileName));
        conn = await mysql.createConnection(dbConf);
        await conn.execute(
            'INSERT INTO galleryphotos (filename, origname, alttext, privacy, userid) VALUES (?,?,?,?,?)',
            [fileName, req.file.originalname.slice(0, 100), req.body.altInput, req.body.privacyInput, 1]
        );
        res.render('galleryphotoupload', { notice: 'Pilt laaditi üles!' });
    } catch (err) {
        console.error(err);
        res.render('galleryphotoupload', { notice: 'Üleslaadimine ebaõnnestus.' });
    } finally {
        if (conn) await conn.end();
    }
};




module.exports = {
    galleryPhotosListGet,
    galleryPhotosUploadGet,
    galleryPhotosUploadPost
};