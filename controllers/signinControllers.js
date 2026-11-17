const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');
const argon2 = require('argon2');
const validator = require('validator');
const dateTimeET = require('../src/dateTimeET.js');

const dbConf = {
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE
};

// logifail projekti kaustas (mitte public all, et seda brauserist ei saaks avada)
const loginLogFile = path.join(__dirname, '..', 'logins.txt');

// lisab faili ühe rea: kuupäev kellaaeg | sündmus | e-post
const logEvent = async (event, email) => {
	try {
		const line = `${dateTimeET.date()} ${dateTimeET.time()} | ${event} | ${email}\n`;
		await fs.appendFile(loginLogFile, line, 'utf-8');
	} catch (err) {
		console.error('Logifaili kirjutamine ebaõnnestus:', err); // login ise ei tohi selle taha jääda
	}
};

//@desc page for logging in
//@route GET /signin
//@access public
const signinPage = (req, res) => {
	res.render('signin', { notice: 'Sisesta oma kasutajatunnus ja salasõna!', formData: {} });
};

//@desc logging in
//@route POST /signin
//@access public
const signinPagePost = async (req, res) => {
	let conn;
	const email = (req.body.emailInput || '').trim().toLowerCase();
	const password = req.body.passwordInput || '';
	const formData = { email };

	if (!email || !password) {
		return res.render('signin', { notice: 'Konto andmed on sisestamata!', formData });
	}
	if (!validator.isEmail(email)) {
		return res.render('signin', { notice: 'E-posti aadress ei ole korrektne!', formData });
	}

	try {
		conn = await mysql.createConnection(dbConf);

		const [users] = await conn.execute('SELECT id, password FROM users WHERE email = ?', [email]);

		// sellist kasutajat ei leitud
		if (users.length === 0) {
			await logEvent('SISSELOGIMINE EBAÕNNESTUS', email);
			return res.render('signin', { notice: 'Kasutajatunnus ja/või salasõna on vale!', formData });
		}

		const user = users[0];

		// parooli kontrollimine räsi vastu
		const match = await argon2.verify(user.password, password);
		if (match) {
			console.log('oled sisseloginud kasutajana: ' + user.id);
	// salvestame sessiooni kasutaja ID, et hiljem saaks kontrollida, kas kasutaja on sisse logitud
			req.session.userId = user.id; 
			await logEvent('SISSE LOGITUD', email);
			return res.redirect('/home');
		} else {
			await logEvent('SISSELOGIMINE EBAÕNNESTUS', email);
			return res.render('signin', { notice: 'Kasutajatunnus ja/või salasõna on vale!', formData });
		}
	} catch (err) {
		console.error('Viga: ' + err);
		res.render('signin', { notice: 'Sisselogimine ei õnnestunud!', formData });
	} finally {
		if (conn) await conn.end();
	}
};

module.exports = { signinPage, signinPagePost };