
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bodyParser = require('body-parser');
const dateTimeET = require('./src/dateTimeET.js');

const vanasonaFail = path.join(__dirname, 'public', 'txt', 'vanasonad.txt');
const visitsFail = path.join(__dirname, 'visits.txt');
/*const mysql = require('mysql2/promise');*/
require('dotenv').config();

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));

// üldised marsruudid
const indexRouter = require('./routes/indexRoutes');
app.use('/', indexRouter);


// eesti filmi marsrutid
const eestifilmRouter = require('./routes/eestifilmRoutes');
app.use('/eestifilm', eestifilmRouter);
	
app.listen(5215);