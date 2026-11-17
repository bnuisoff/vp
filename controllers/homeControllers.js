const mysql = require('mysql2/promise');

const dbConf = {
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE
};

//@desc greeting page after login
//@route GET /home
//@access private
const homePage = async (req, res) => {
	let conn;
	let latestNews = null;
	try {
		conn = await mysql.createConnection(dbConf);
		const [rows] = await conn.execute(
			`SELECT news_title, news_text, created, filename, alttext
			 FROM news
			 WHERE expire_date >= CURDATE() AND deleted IS NULL
			 ORDER BY id DESC LIMIT 1`
		);
		if (rows.length > 0) latestNews = rows[0];
	} catch (err) {
		console.error(err);
	} finally {
		if (conn) await conn.end();
	}
	res.render('home', { latestNews });
};

module.exports = { homePage };