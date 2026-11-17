//@desc greeting page after login
//@route GET /home
//@access public
const homePage = (req, res) => {
	res.render('home');
};

module.exports = { homePage };