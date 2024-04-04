var express = require('express');
var router = express.Router();
var userModel = require("./users");
var question = require("./question")
const passport = require('passport');
var localStrategy = require('passport-local').Strategy;

// Initialize Passport.js
passport.use(new localStrategy(userModel.authenticate()));
passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Express' });
});
router.get('/admin', function (req, res, next) {
    res.render('admin', { title: 'Express' });
});

router.post('/done', function (req, res, next) {
    var data = new question({
        category: req.body.category,
        question: req.body.question,
        notes: req.body.notes,
        link: req.body.link
    })
    data.save().then(item => {
        res.send("data is saved " + data);
    }).catch(err => {
        res.status(400).send("unable to save");
    });
});

router.get('/profile', isLoggedIn, async function (req, res, next) {
    try {
        const user = req.session.passport.user;
        const categories = await question.distinct('category');
        const foundUser = await userModel.findOne({ username: req.session.passport.user });
        res.render('profile', { user: foundUser, categories: categories });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/data/:elem', isLoggedIn, async function (req, res, next) {
    const elem = req.params.elem;
    const foundQuestion = await question.find({ category: elem });
    if (foundQuestion) {
        res.render('p1', { data: foundQuestion, category: elem })
    } else {
        res.send('Question not found');
    }
});

router.get('/delete/:elem', isLoggedIn, async function (req, res, next) {
    try {
        const { elem } = req.params;
        const deletedQuestion = await question.findOneAndDelete({ _id: elem });

        let redirectRoute = '/profile';

        if (deletedQuestion) {
            res.redirect(redirectRoute);
        } else {
            return res.status(404).json({ message: 'Question not found' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/register', function (req, res) {
    var newUser = new userModel({
        username: req.body.username,
        email: req.body.email,
        number: req.body.number
    })
    userModel.register(newUser, req.body.password)
        .then(function () {
            passport.authenticate('local')(req, res, function () {
                res.redirect('/profile')
            })
        })
        .catch(function (val) {
            res.send(val)
        })
});

router.post('/login', passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/'
}));

router.get('/logout', function (req, res, next) {
    req.logout();
    res.redirect('/');
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    else
        res.redirect('/');
}

router.get('/question', isLoggedIn, async function (req, res, next) {
    var users = await userModel.find({});
    res.send(users)
})

module.exports = router;
