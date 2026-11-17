const fs = require('fs').promises;
const path = require('path');
const dateTimeET = require('../src/dateTimeET.js');
const mysql = require('mysql2/promise');

const dbConf = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
};

const vanasonaFail = path.join(__dirname, '..', 'public', 'txt', 'vanasonad.txt');
/*const visitsFail = path.join(__dirname, '..', 'visits.txt');*/

//@desc home page
//@route GET /
//@access public
const index = async (req, res) => {
    let conn;
let photos = [];
let photo = null;
let latestNews = null;   // <- uus
    try {
        conn = await mysql.createConnection(dbConf);
        // kõik avalikud fotod (pisipiltide riba jaoks)
        const [rows] = await conn.execute(
            'SELECT filename, alttext FROM galleryphotos WHERE privacy = 3 AND deleted IS NULL ORDER BY id DESC'
        );
        photos = rows;
        // uusim avalik foto
        const [newest] = await conn.execute(
            'SELECT filename, alttext FROM galleryphotos WHERE id=(SELECT MAX(id) FROM galleryphotos WHERE privacy=? AND deleted IS NULL)',
            [3]
        );
        if (newest.length > 0) photo = newest[0];
                // uusim uudis, mis pole aegunud ega kustutatud
        const [newsRows] = await conn.execute(
            `SELECT news_title, news_text, created, filename, alttext
             FROM news
             WHERE expire_date >= CURDATE() AND deleted IS NULL
             ORDER BY id DESC LIMIT 1`
        );
        if (newsRows.length > 0) latestNews = newsRows[0];
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) await conn.end();
    }
    res.render('index', {
        day: dateTimeET.day(),
        date: dateTimeET.date(),
        time: dateTimeET.time(),
        photos: photos,
        photo: photo,
        latestNews: latestNews
    });
};

//@desc about me page
//@route GET /minust
//@access public
const minust = (req, res) => {
	res.render('minust');
};

//@desc random proverb
//@route GET /vanasona
//@access public
const vanasona = async (req, res) => {
	try {
		const data = await fs.readFile(vanasonaFail, 'utf-8');
		const vanasonad = data.split(';').filter(v => v.trim() !== '');
		res.render('vanasona', {
			wisdom: vanasonad[Math.floor(Math.random() * vanasonad.length)]
		});
	} catch (err) {
		console.error(err);
		res.render('vanasona', { wisdom: 'Kahjuks ei leidnud ühtegi vanasõna. Palun proovi hiljem uuesti.' });
	}
};


module.exports = {
	index,
	minust,
	vanasona,
};