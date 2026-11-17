const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();
const session = require('express-session');
const checkLogin = require('./src/checkLogin.js');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
//võtame sessiooni kasutusele
app.use(session({
	secret: process.env.SES_SECRET,
	saveUninitialized: false,
	resave: true,
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: true }));

// üldised marsruudid
const indexRouter = require('./routes/indexRoutes');
app.use('/', indexRouter);


//väljalogimine
app.get('/logout' , (req, res) => {
    req.session.destroy();
    res.redirect('/');
});


// eesti filmi marsrutid
const eestifilmRouter = require('./routes/eestifilmRoutes');
app.use('/eestifilm', eestifilmRouter);

// külastuste marsrutid
const visitsRouter = require('./routes/visitsRoutes');
app.use('/visits', visitsRouter);

// galeriipiltide marsruudid
const galleryphotosRoutes = require('./routes/galleryphotosRoutes');
app.use('/galleryphotos', galleryphotosRoutes);

// kasutajakonto loomine
const signupRouter = require('./routes/signupRoutes');
app.use('/signup', signupRouter);

// sisselogimine
const signinRouter = require('./routes/signinRoutes');
app.use('/signin', signinRouter);

// tervituslehekülg pärast sisselogimist (ainult sisseloginud kasutajale)
const homeRouter = require('./routes/homeRoutes');
app.use('/home', checkLogin.isLogin, homeRouter);

// uudised (ainult sisseloginud kasutajale)
const newsRouter = require('./routes/newsRoutes');
app.use('/news', checkLogin.isLogin, newsRouter);

app.listen(5215);