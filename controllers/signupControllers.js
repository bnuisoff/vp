const mysql = require('mysql2/promise');
const argon2 = require('argon2');
const validator = require('validator');

const dbConf = {
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE
};

//@desc signup page
//@route GET /signup
//@access public
const signupPage = (req, res) => {
	res.render('signup', { notice: '', formData: { gender: '1' } });
};

//@desc create user account
//@route POST /signup
//@access public
const signupPagePost = async (req, res) => {
	let conn;

	// 1) võtame vormist andmed, tühikud ümbert ära
	const firstName = (req.body.firstNameInput || '').trim();
	const lastName = (req.body.lastNameInput || '').trim();
	const birthDate = req.body.birthDateInput || '';
	const gender = req.body.genderInput || '';
	const email = (req.body.emailInput || '').trim().toLowerCase();
	const password = req.body.passwordInput || '';
	const confirmPassword = req.body.confirmPasswordInput || '';

	// need saadame vea korral vormi tagasi (parooli mitte kunagi)
	const formData = { firstName, lastName, birthDate, gender, email };

	// 2) kontrollid validator mooduliga
	if (!firstName || !lastName || !birthDate || !gender || !email || !password || !confirmPassword) {
		return res.render('signup', { notice: 'Palun täida kõik väljad!', formData });
	}
	if (!validator.isLength(firstName, { min: 1, max: 140 }) || !validator.isLength(lastName, { min: 1, max: 100 })) {
		return res.render('signup', { notice: 'Eesnimi või perekonnanimi on liiga pikk!', formData });
	}
	if (!validator.isDate(birthDate, { format: 'YYYY-MM-DD', strictMode: true }) || !validator.isBefore(birthDate)) {
		return res.render('signup', { notice: 'Sünnikuupäev on vigane!', formData });
	}
	if (!validator.isIn(gender, ['1', '2'])) {
		return res.render('signup', { notice: 'Sugu on valitud valesti!', formData });
	}
	if (!validator.isEmail(email) || !validator.isLength(email, { max: 250 })) {
		return res.render('signup', { notice: 'E-posti aadress ei ole korrektne!', formData });
	}
	if (!validator.isLength(password, { min: 8, max: 72 })) {
		return res.render('signup', { notice: 'Salasõna peab olema 8 kuni 72 märki pikk!', formData });
	}
	if (!validator.equals(password, confirmPassword)) {
		return res.render('signup', { notice: 'Salasõnad ei ühti!', formData });
	}
	try {
		conn = await mysql.createConnection(dbConf);

		// 3) kas selle e-postiga konto on juba olemas?
		const [existing] = await conn.execute('SELECT id FROM users WHERE email = ?', [email]);
		if (existing.length > 0) {
			return res.render('signup', { notice: 'Selle e-postiga konto on juba olemas!', formData });
		}

        // kas parool on liiga lihtne
        const passwordOptions = {
            minLength: 8,
            maxLength: 72,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 0
        };
        if (!validator.isStrongPassword(password, passwordOptions)) {
            return res.render('signup', { notice: 'Salasõna peab sisaldama vähemalt ühte suurtähte, ühte väiketähte ja ühte numbrit!', formData });
        }
		// 4) salasõnast räsi (10 = mitu "vvooru" bcrypt arvutab; suurem = aeglasem ja turvalisem)
		const passwordHash = await argon2.hash(password);

        sqlReq = 'INSERT INTO users (firstname, lastname, birthdate, gender, email, password) VALUES (?,?,?,?,?,?)';
        const [result] = await conn.execute(sqlReq,
             [firstName, 
            lastName,
            birthDate,
            gender,
            email,
            passwordHash]);
    res.render('signup', { notice: 'Kasutajakonto on loodud!', formData: { gender: '1' } });
    } catch (err) {
        console.error(err);
        res.render('signup', { notice: 'Konto loomine ebaõnnestus.', formData });
    } finally {
        if (conn) await conn.end();
    }
};

module.exports = { signupPage, signupPagePost };