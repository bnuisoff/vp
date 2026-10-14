const fs = require('fs').promises;
const path = require('path');
const dateTimeET = require('../src/dateTimeET.js');

const visitsFail = path.join(__dirname, '..', 'visits.txt');

//@desc külastuste koduleht, näitab viimast külastust
//@route GET /visits
//@access public
const visits = async (req, res) => {
	try {
		const data = await fs.readFile(visitsFail, 'utf-8');
		const rows = data.split(';').filter(v => v.trim() !== '');
		if (rows.length === 0) {
			return res.render('visits', { message: 'Külastusi pole veel registreeritud.' });
		}
		const [nimi, kuupaev, kellaaeg] = rows[rows.length - 1].split(',');
		res.render('visits', {
			message: 'Viimati registreeriti külastus ' + kuupaev + ', kell ' + kellaaeg + ' kui seda tegi ' + nimi + '.'
		});
	} catch (err) {
		console.error(err);
		res.render('visits', { message: 'Külastusi pole veel registreeritud.' });
	}
};

//@desc külastuse registreerimine
//@route GET /visits/regvisit
//@access public
const regvisit = (req, res) => {
	res.render('regvisit', { message: '' });
};

//@desc külastuse salvestamine
//@route POST /visits/regvisit
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

module.exports = { visits, regvisit, regvisitPost };