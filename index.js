const express = require('express');
const fs = require('fs').promises;
const bodyParser = require('body-parser');
const dateTimeET = require('./src/dateTimeET.js');

const vanasonaFail = 'txt/vanasonad.txt';
const visitsFail = 'visits.txt';

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

// avaleht
app.get('/', (req, res) => {
    res.render('index', {
        day: dateTimeET.day(),
        date: dateTimeET.date(),
        time: dateTimeET.time()
    });
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

// 2) külastuse registreerimise vorm
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

app.listen(5215);