const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const validator = require('validator');

const dbConf = {
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE
};

const origDir = path.join(__dirname, '..', process.env.UPLOAD_NEWS_ORIGINAL_PATH);
const normalDir = path.join(__dirname, '..', process.env.UPLOAD_NEWS_RESIZED_PATH);

// kuupäev kujul YYYY-MM-DD (sobib andmebaasi ja <input type="date"> jaoks)
const toDateStr = (d) => {
	return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
const defaultExpire = () => {
	const d = new Date();
	d.setDate(d.getDate() + 7); // vaikimisi 7 päeva pärast
	return toDateStr(d);
};

//@desc page for adding news
//@route GET /news/addnews
//@access private
const addNewsPage = (req, res) => {
	res.render('addnews', { notice: '', formData: { expire: defaultExpire() } });
};

//@desc saving news
//@route POST /news/addnews
//@access private
const addNewsPost = async (req, res) => {
	let conn;
	const title = (req.body.titleInput || '').trim();
	const content = (req.body.contentInput || '').trim();
	const expire = req.body.expireInput || defaultExpire();
	const alt = (req.body.altInput || '').trim();
	const formData = { title, content, expire, alt };

	// abifunktsioon: kustutab ajutise faili ja näitab viga
	const fail = async (notice) => {
		if (req.file) {
			await fs.unlink(req.file.path).catch(() => {});
		}
		return res.render('addnews', { notice, formData });
	};

	// valideerimine
	if (req.fileTypeError) {
		return fail('Pildi failitüüp ei sobi (lubatud JPG, PNG, GIF)!');
	}
	if (!title || !content) {
		return fail('Uudise pealkiri ja sisu on kohustuslikud!');
	}
	if (!validator.isLength(title, { min: 1, max: 100 })) {
		return fail('Pealkiri on liiga pikk (max 100 märki)!');
	}
	if (!validator.isLength(content, { min: 1, max: 2000 })) {
		return fail('Uudise sisu on liiga pikk (max 2000 märki)!');
	}
	if (!validator.isDate(expire, { format: 'YYYY-MM-DD', strictMode: true })) {
		return fail('Aegumiskuupäev on vigane!');
	}
	if (expire < toDateStr(new Date())) {
		return fail('Aegumiskuupäev ei saa olla minevikus!');
	}
	if (req.file && alt === '') {
		return fail('Lisa pildile ka kirjeldus (alt-tekst)!');
	}
	if (!validator.isLength(alt, { max: 255 })) {
		return fail('Pildi kirjeldus on liiga pikk (max 255 märki)!');
	}

	try {
		let fileName = null;
		if (req.file) {
			fileName = 'news_' + Date.now() + path.extname(req.file.originalname).toLowerCase();
			const origPath = path.join(origDir, fileName);
			// originaal säilib orig kaustas uue nimega
			await fs.rename(req.file.path, origPath);
			// uudiskõlbulik 400x300 versioon
			await sharp(origPath, { animated: true })
				.resize(400, 300, { fit: 'cover' })
				.toFile(path.join(normalDir, fileName));
		}

		conn = await mysql.createConnection(dbConf);
		await conn.execute(
			'INSERT INTO news (news_title, news_text, expire_date, userid, filename, alttext) VALUES (?,?,?,?,?,?)',
			[title, content, expire, req.session.userId, fileName, fileName ? alt : null]
		);
		res.render('addnews', { notice: 'Uudis on salvestatud!', formData: { expire: defaultExpire() } });
	} catch (err) {
		console.error(err);
		res.render('addnews', { notice: 'Uudise salvestamine ebaõnnestus!', formData });
	} finally {
		if (conn) await conn.end();
	}
};

//@desc page for reading news
//@route GET /news
//@access private
const newsListGet = async (req, res) => {
	let conn;
	try {
		conn = await mysql.createConnection(dbConf);
		const sql = `SELECT news.news_title, news.news_text, news.created, news.filename, news.alttext,
				users.firstname, users.lastname
			FROM news
			JOIN users ON news.userid = users.id
			WHERE news.expire_date >= ? AND news.deleted IS NULL
			ORDER BY news.id DESC`;
		const [newsList] = await conn.execute(sql, [toDateStr(new Date())]);
		res.render('news', { newsList });
	} catch (err) {
		console.error(err);
		res.render('news', { newsList: [] });
	} finally {
		if (conn) await conn.end();
	}
};

module.exports = { addNewsPage, addNewsPost, newsListGet };