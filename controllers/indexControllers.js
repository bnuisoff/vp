const fs = require('fs').promises;
const path = require('path');
const dateTimeET = require('../src/dateTimeET.js');

const vanasonaFail = path.join(__dirname, '..', 'public', 'txt', 'vanasonad.txt');
/*const visitsFail = path.join(__dirname, '..', 'visits.txt');*/

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


module.exports = {
	index,
	minust,
	vanasona,
};