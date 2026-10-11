
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bodyParser = require('body-parser');
const dateTimeET = require('./src/dateTimeET.js');

const vanasonaFail = path.join(__dirname, 'public', 'txt', 'vanasonad.txt');
const visitsFail = path.join(__dirname, 'visits.txt');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));

// avaleht
app.get('/', (req, res) => {
    res.render('index', {
        day: dateTimeET.day(),
        date: dateTimeET.date(),
        time: dateTimeET.time()
    });
});

//minust
app.get('/minust', (req, res) => {
	res.render('minust');
});

// vanasõna
app.get('/vanasona', async (req, res) => {
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
});

// külastuse registreerimise vorm
app.get('/regvisit', (req, res) => {
    res.render('regvisit', { message: '' });
});

app.post('/regvisit', async (req, res) => {
    try {
        const rida = req.body.inputName + ',' + dateTimeET.date() + ',' + dateTimeET.time() + ';';
        await fs.appendFile(visitsFail, rida);
        res.render('regvisit', { message: 'Sinu nimi on salvestatud!' });
    } catch (err) {
        console.error(err);
        res.render('regvisit', { message: 'Kahjuks ei õnnestunud sinu nime salvestada. Palun proovi hiljem uuesti.' });
    }
});

// viimane külastus
app.get('/visitlog', async (req, res) => {
    try {
        const data = await fs.readFile(visitsFail, 'utf-8');
        const visits = data.split(';');
        // viimane element on tühi (rida lõpeb semikooloniga), seega viimane külastus on eelviimane
        if (visits.length < 2) {
            return res.render('visitlog', { message: 'Külastusi pole veel registreeritud.' });
        }
        const [nimi, kuupaev, kellaaeg] = visits[visits.length - 2].split(',');
        res.render('visitlog', {
            message: 'Viimati registreeriti külastus ' + kuupaev + ', kell ' + kellaaeg + ' kui seda tegi ' + nimi + '.'
        });
    } catch (err) {
        console.error(err);
        res.render('visitlog', { message: 'Külastuste lugemine ebaõnnestus. Palun proovi hiljem uuesti.' });
    }
});

//eesti filmi leht
app.get('/eestifilm', async (req, res)=>{
	res.render('eestifilm');
});

app.get('/eestifilminimesed', async (req, res) => {
    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE
        });
        let sqlReq = 'SELECT * FROM person';
        const [sqlRes] = await conn.execute(sqlReq);
        res.render('eestifilminimesed', { personList: sqlRes });
    }
    catch (err) {
        console.log('Andmebaasi ühendus ebaõnnestus: ' + err);
        res.render('eestifilminimesed', { personList: [] });
    }
    finally {
        if (conn) {
            await conn.end();
        }
    }
});

app.get('/eestifilminimesed_lisa', (req, res) => {
	// lehe laadimisel on sisendid tühjad (null)
	res.render('eestifilminimesed_lisa', {
		notice: '',
		firstNameInput: null,
		lastNameInput: null,
		bornInput: null,
		deceasedInput: null
	});
});

app.post('/eestifilminimesed_lisa', async (req, res) => {
	console.log(req.body);
	const firstName = (req.body.firstNameInput || '').trim();
	const lastName = (req.body.lastNameInput || '').trim();
	const born = req.body.bornInput;
	const deceased = req.body.deceasedInput;
	const now = new Date();
	const errors = [];

	// iga sisendi kontroll eraldi
	if (!firstName) {
		errors.push('Eesnimi on puudu!');
	}
	if (!lastName) {
		errors.push('Perekonnanimi on puudu!');
	}

	const bornDate = new Date(born);
	let bornOk = true;
	if (!born || isNaN(bornDate.getTime())) {
		errors.push('Sünnikuupäev on puudu või vigane!');
		bornOk = false;
	} else if (bornDate > now) {
		errors.push('Sünnikuupäev ei saa olla tulevikus!');
		bornOk = false;
	}

	let deceasedDate = null;
	if (deceased !== '' && deceased !== undefined) {
		const dDate = new Date(deceased);
		if (isNaN(dDate.getTime())) {
			errors.push('Surmakuupäev on vigane!');
		} else if (dDate > now) {
			errors.push('Surmakuupäev ei saa olla tulevikus!');
		} else if (bornOk && dDate < bornDate) {
			errors.push('Surmakuupäev ei saa olla varasem kui sünnikuupäev!');
		} else {
			deceasedDate = deceased;
		}
	}

	if (errors.length > 0) {
		// viga: saadame sisestatud väärtused tagasi vormi
		return res.render('eestifilminimesed_lisa', {
			notice: errors.join(' '),
			firstNameInput: firstName,
			lastNameInput: lastName,
			bornInput: born,
			deceasedInput: deceased
		});
	}

	let conn;
	try {
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_DATABASE
		});
		const sqlReq = 'INSERT INTO person (first_name, last_name, born, deceased) VALUES (?, ?, ?, ?)';
		await conn.execute(sqlReq, [firstName, lastName, born, deceasedDate]);
		// korrektne sisestus: sisendid tühjaks (null)
		res.render('eestifilminimesed_lisa', {
			notice: 'Andmed salvestatud!',
			firstNameInput: null,
			lastNameInput: null,
			bornInput: null,
			deceasedInput: null
		});
	}
	catch (err) {
		console.log('Andmete salvestamine ebaõnnestus: ' + err);
		res.render('eestifilminimesed_lisa', {
			notice: 'Salvestamine ebaõnnestus!',
			firstNameInput: firstName,
			lastNameInput: lastName,
			bornInput: born,
			deceasedInput: deceased
		});
	}
	finally {
		if (conn) {
			await conn.end();
		}
	}
});


app.get('/eestifilmifilmid_lisa', (req, res) => {
	res.render('eestifilmifilmid_lisa', {
		notice: '',
		titleInput: null,
		releaseYearInput: null,
		durationInput: null,
		descriptionInput: null
	});
});

app.post('/eestifilmifilmid_lisa', async (req, res) => {
	console.log(req.body);
	const title = (req.body.titleInput || '').trim();
	const releaseYear = req.body.releaseYearInput;
	const duration = req.body.durationInput;
	const description = (req.body.descriptionInput || '').trim();
	const currentYear = new Date().getFullYear();
	const errors = [];

	if (!title) {
		errors.push('Filmi pealkiri on puudu!');
	} else if (title.length > 100) {
		errors.push('Filmi pealkiri on liiga pikk (max 100 märki)!');
	}

	const yearNr = Number(releaseYear);
	if (!releaseYear || !Number.isInteger(yearNr)) {
		errors.push('Valmimisaasta on puudu või vigane!');
	} else if (yearNr < 1888 || yearNr > currentYear) {
		errors.push('Valmimisaasta peab olema vahemikus 1888 kuni ' + currentYear + '!');
	}

	const durationNr = Number(duration);
	if (!duration || !Number.isInteger(durationNr)) {
		errors.push('Kestus on puudu või vigane!');
	} else if (durationNr < 1 || durationNr > 1000) {
		errors.push('Kestus peab olema vahemikus 1 kuni 1000 minutit!');
	}

	if (description.length > 1000) {
		errors.push('Kirjeldus on liiga pikk (max 1000 märki)!');
	}

	if (errors.length > 0) {
		return res.render('eestifilmifilmid_lisa', {
			notice: errors.join(' '),
			titleInput: title,
			releaseYearInput: releaseYear,
			durationInput: duration,
			descriptionInput: description
		});
	}

	let conn;
	try {
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_DATABASE
		});
		const sqlReq = 'INSERT INTO movie (title, release_year, duration_minutes, description) VALUES (?, ?, ?, ?)';
		await conn.execute(sqlReq, [title, yearNr, durationNr, description === '' ? null : description]);
		res.render('eestifilmifilmid_lisa', {
			notice: 'Film salvestatud!',
			titleInput: null,
			releaseYearInput: null,
			durationInput: null,
			descriptionInput: null
		});
	}
	catch (err) {
		console.log('Filmi salvestamine ebaõnnestus: ' + err);
		res.render('eestifilmifilmid_lisa', {
			notice: 'Salvestamine ebaõnnestus!',
			titleInput: title,
			releaseYearInput: releaseYear,
			durationInput: duration,
			descriptionInput: description
		});
	}
	finally {
		if (conn) {
			await conn.end();
		}
	}
});


app.get('/eestifilmiametid_lisa', (req, res) => {
	res.render('eestifilmiametid_lisa', {
		notice: '',
		titleInput: null,
		descriptionInput: null
	});
});

app.post('/eestifilmiametid_lisa', async (req, res) => {
	console.log(req.body);
	const title = (req.body.titleInput || '').trim();
	const description = (req.body.descriptionInput || '').trim();
	const errors = [];

	if (!title) {
		errors.push('Ameti nimetus on puudu!');
	} else if (title.length > 50) {
		errors.push('Ameti nimetus on liiga pikk (max 50 märki)!');
	}

	if (description.length > 1000) {
		errors.push('Kirjeldus on liiga pikk (max 1000 märki)!');
	}

	if (errors.length > 0) {
		return res.render('eestifilmiametid_lisa', {
			notice: errors.join(' '),
			titleInput: title,
			descriptionInput: description
		});
	}

	let conn;
	try {
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_DATABASE
		});
		const sqlReq = 'INSERT INTO profession (title, description) VALUES (?, ?)';
		await conn.execute(sqlReq, [title, description === '' ? null : description]);
		res.render('eestifilmiametid_lisa', {
			notice: 'Amet salvestatud!',
			titleInput: null,
			descriptionInput: null
		});
	}
	catch (err) {
		console.log('Ameti salvestamine ebaõnnestus: ' + err);
		res.render('eestifilmiametid_lisa', {
			notice: 'Salvestamine ebaõnnestus!',
			titleInput: title,
			descriptionInput: description
		});
	}
	finally {
		if (conn) {
			await conn.end();
		}
	}
});

console.log('Staatilised failid asuvad siin:', path.join(__dirname, 'public'));
console.log('Pildid selles kaustas:', require('fs').readdirSync(path.join(__dirname, 'public', 'pic')));

app.listen(5215);