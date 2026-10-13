const fs = require('fs').promises;
const path = require('path');
const dateTimeET = require('../src/dateTimeET.js');

const vanasonaFail = path.join(__dirname, '..', 'public', 'txt', 'vanasonad.txt');
const visitsFail = path.join(__dirname, '..', 'visits.txt');

//@desc home page
//@route GET /
//@access public
const index = (req, res) => {
	res.render('index', {
		day: dateTimeET.day(),
		date: dateTimeET.date(),
		time: dateTimeET.time()
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

//@desc visit registration form
//@route GET /regvisit
//@access public
const regvisit = (req, res) => {
	res.render('regvisit', { message: '' });
};

//@desc saving a visit
//@route POST /regvisit
//@access public
const regvisitPost = async (req, res) => {
	try {
		const rida = req.body.inputName + ',' + dateTimeET.date() + ',' + dateTimeET.time() + ';';
		await fs.appendFile(visitsFail, rida);
		res.render('regvisit', { message: 'Sinu nimi on salvestatud!' });
	} catch (err) {
		console.error(err);
		res.render('regvisit', { message: 'Kahjuks ei õnnestunud sinu nime salvestada. Palun proovi hiljem uuesti.' });
	}
};

//@desc last visit
//@route GET /visitlog
//@access public
const visitlog = async (req, res) => {
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
};

module.exports = {
	index,
	minust,
	vanasona,
	regvisit,
	regvisitPost,
	visitlog
};