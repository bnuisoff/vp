const mysql = require('mysql2/promise');

//@desc home page for estonian film section
// @route GET /eestifilm
//@access public


//app.get('/eestifilm', (req, res) => {
    const eestifilm = (req, res) => {   
    res.render('eestifilm');
    
  };

//@desc home page for people involved in estonian film industry
// @route GET /eestifilminimesed
//@access public

  //app.get('/eestifilminimesed', async (req, res) => {
const eestifilminimesed = async (req, res) => {
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
    };
};


//@desc home page for adding people involved in estonian film industry
// @route GET /eestifilminimesed
//@access public
//app.get('/eestifilminimesed_lisa', (req, res) => {
	// lehe laadimisel on sisendid tühjad (null)

const eestifilminimesedAdd = (req, res) => {
	res.render('eestifilminimesed_lisa', {
		notice: '',
		firstNameInput: null,
		lastNameInput: null,
		bornInput: null,
		deceasedInput: null
	});
};


//@desc home page for adding people involved in estonian film industry
// @route GET /eestifilminimesed
//@access public
//app.post('/eestifilminimesed_lisa', async (req, res) => {
const eestifilminimesedAddPost = async (req, res) => {
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
};

//@desc page for adding movies
//@route GET /eestifilm/eestifilmifilmid_lisa
//@access public
const eestifilmifilmidAdd = (req, res) => {
	res.render('eestifilmifilmid_lisa', {
		notice: '',
		titleInput: null,
		releaseYearInput: null,
		durationInput: null,
		descriptionInput: null
	});
};

//@desc saving a movie
//@route POST /eestifilm/eestifilmifilmid_lisa
//@access public
const eestifilmifilmidAddPost = async (req, res) => {
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
};

//@desc page for adding professions
//@route GET /eestifilm/eestifilmiametid_lisa
//@access public
const eestifilmiametidAdd = (req, res) => {
	res.render('eestifilmiametid_lisa', {
		notice: '',
		titleInput: null,
		descriptionInput: null
	});
};

//@desc saving a profession
//@route POST /eestifilm/eestifilmiametid_lisa
//@access public
const eestifilmiametidAddPost = async (req, res) => {
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
};

//väike abifunktsioon, et ühendust mitte kogu aeg kirjutada
const getConnection = () => mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE
});

//rippmenüüde andmed
const loadSelectLists = async (conn) => {
	const [persons] = await conn.execute('SELECT id, first_name, last_name FROM person ORDER BY last_name, first_name');
	const [movies] = await conn.execute('SELECT id, title FROM movie ORDER BY title');
	const [professions] = await conn.execute('SELECT id, title FROM profession ORDER BY title');
	return { persons, movies, professions };
};

//@desc page for adding person-movie-profession relations
//@route GET /eestifilm/eestifilmiseosed_lisa
//@access public
const eestifilmiseosedAdd = async (req, res) => {
	let conn;
	try {
		conn = await getConnection();
		const lists = await loadSelectLists(conn);
		res.render('eestifilmiseosed_lisa', {
			notice: '',
			...lists,
			personInput: null,
			movieInput: null,
			professionInput: null,
			characterInput: ''
		});
	}
	catch (err) {
		console.log('Andmete laadimine ebaõnnestus: ' + err);
		res.render('eestifilmiseosed_lisa', {
			notice: 'Andmete laadimine ebaõnnestus!',
			persons: [], movies: [], professions: [],
			personInput: null, movieInput: null, professionInput: null, characterInput: ''
		});
	}
	finally {
		if (conn) {
			await conn.end();
		}
	}
};

//@desc saving a relation
//@route POST /eestifilm/eestifilmiseosed_lisa
//@access public
const eestifilmiseosedAddPost = async (req, res) => {
	console.log(req.body);
	const personId = Number(req.body.personInput);
	const movieId = Number(req.body.movieInput);
	const professionId = Number(req.body.professionInput);
	const character = (req.body.characterInput || '').trim();

	let conn;
	try {
		conn = await getConnection();
		const lists = await loadSelectLists(conn);

		// väärtused tagasi vormi (null = pole valitud)
		const form = {
			...lists,
			personInput: personId || null,
			movieInput: movieId || null,
			professionInput: professionId || null,
			characterInput: character
		};

		const errors = [];
		if (!Number.isInteger(personId) || personId < 1) errors.push('Isik on valimata!');
		if (!Number.isInteger(movieId) || movieId < 1) errors.push('Film on valimata!');
		if (!Number.isInteger(professionId) || professionId < 1) errors.push('Amet on valimata!');
		if (character.length > 100) errors.push('Tegelase nimi on liiga pikk (max 100 märki)!');

		if (errors.length > 0) {
			return res.render('eestifilmiseosed_lisa', { notice: errors.join(' '), ...form });
		}

		// kas täpselt sama seos on juba olemas?
		const [exists] = await conn.execute(
			'SELECT id FROM person_in_movie WHERE person_id = ? AND movie_id = ? AND profession_id = ?',
			[personId, movieId, professionId]
		);
		if (exists.length > 0) {
			return res.render('eestifilmiseosed_lisa', { notice: 'Selline seos on juba olemas!', ...form });
		}

		await conn.execute(
			'INSERT INTO person_in_movie (person_id, movie_id, profession_id, character_name) VALUES (?, ?, ?, ?)',
			[personId, movieId, professionId, character === '' ? null : character]
		);
		res.render('eestifilmiseosed_lisa', {
			notice: 'Seos salvestatud!',
			...lists,
			personInput: null,
			movieInput: null,
			professionInput: null,
			characterInput: ''
		});
	}
	catch (err) {
		console.log('Seose salvestamine ebaõnnestus: ' + err);
		res.render('eestifilmiseosed_lisa', {
			notice: 'Salvestamine ebaõnnestus!',
			persons: [], movies: [], professions: [],
			personInput: null, movieInput: null, professionInput: null, characterInput: character
		});
	}
	finally {
		if (conn) {
			await conn.end();
		}
	}
};

//@desc page listing all relations
//@route GET /eestifilm/eestifilmiseosed
//@access public
const eestifilmiseosed = async (req, res) => {
	let conn;
	try {
		conn = await getConnection();
		const sqlReq = `SELECT person.first_name, person.last_name, movie.title AS movie_title,
			profession.title AS profession_title, person_in_movie.character_name
			FROM person_in_movie
			JOIN person ON person_in_movie.person_id = person.id
			JOIN movie ON person_in_movie.movie_id = movie.id
			JOIN profession ON person_in_movie.profession_id = profession.id
			ORDER BY movie.title, person.last_name`;
		const [sqlRes] = await conn.execute(sqlReq);
		res.render('eestifilmiseosed', { relationList: sqlRes });
	}
	catch (err) {
		console.log('Seoste lugemine ebaõnnestus: ' + err);
		res.render('eestifilmiseosed', { relationList: [] });
	}
	finally {
		if (conn) {
			await conn.end();
		}
	}
};

module.exports = {
	eestifilm,
	eestifilminimesed,
	eestifilminimesedAdd,
	eestifilminimesedAddPost,
	eestifilmifilmidAdd,
	eestifilmifilmidAddPost,
	eestifilmiametidAdd,
	eestifilmiametidAddPost,
	eestifilmiseosedAdd,
	eestifilmiseosedAddPost,
	eestifilmiseosed
};