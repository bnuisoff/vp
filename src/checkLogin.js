exports.isLogin = function (req, res, next) {
    if (req.session.userId) {
        console.log('Sisse on logitud kasutaja: ' + req.session.userId);
        next();
    } else {
        console.log('Sessioonimuutujat pole?!');
        res.redirect('/signin');
    }
} 