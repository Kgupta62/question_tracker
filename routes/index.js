var express = require('express');
var router = express.Router();
var mongoose = require("mongoose")
var userModel = require("./users");
var question = require("./question")
const passport = require('passport');
var localStrategy = require('passport-local').Strategy;

const DB = 'mongodb+srv://Kuber:kuber8821@cluster0.n0oisen.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(DB).then(() => {
    console.log('connection successful');
}).catch((err) => console.log(err));


// Initialize Passport.js
passport.use(new localStrategy(userModel.authenticate()));
passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());

// Middleware to check if the user is authenticated
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next(); // Continue to the next middleware or route handler
    } else {
        res.redirect('/'); // Redirect to the home page or login page
    }
}

// Routes
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Express' });
});

router.get('/admin', isLoggedIn, function (req, res, next) {
    res.render('admin', { title: 'Express' });
});

router.post('/done', isLoggedIn, function (req, res, next) {
    var data = new question({
        category: req.body.category,
        question: req.body.question,
        notes: req.body.notes,
        link: req.body.link
    })
    data.save().then(item => {
        // Render the 'done' view with the saved data
        res.render('done', { data: data });
    }).catch(err => {
        res.status(400).send("Unable to save");
    });
});

router.get('/profile', isLoggedIn, async function (req, res, next) {
    try {
        const user = req.session.passport.user;
        let categories = await question.distinct('category');
        const foundUser = await userModel.findOne({ username: req.session.passport.user });

        if (categories.length === 0) {
            res.render('profile', { user: foundUser, categories: categories });
        } else {
            res.render('profile', { user: foundUser, categories: categories });
        }
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
    req.logout(function(err) {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});

router.get('/question', isLoggedIn, async function (req, res, next) {
    var users = await userModel.find({});
    res.send(users)
});

// Define a route to handle picking a random question
router.get('/random-question', isLoggedIn, async function (req, res, next) {
    try {
        // Retrieve a random question from your data source
        const randomQuestion = await question.aggregate([{ $sample: { size: 1 } }]);

        // Render the random-question.ejs template and pass the random question data to it
        res.render('random-question', { randomQuestion: randomQuestion[0] });
    } catch (error) {
        // Handle errors appropriately
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/search', async function(req, res) {
    try {
      const searchQuery = req.body.q; // Retrieve the search query from URL parameters
  
      // Perform a search for the search query in the 'question' field of the database
      const foundQuestions = await question.find({ question: searchQuery });
        console.log(foundQuestions)
      res.render('search-results', { questions: foundQuestions });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });




  router.get('/forgot-password', (req, res) => {
    res.render('forget', { message: null });
  });
  
  router.post('/forgot', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Check if user with this email exists
        const user = await userModel.findOne({ email });
  
        if (!user) {
            return res.render('forget', { message: 'User with this email does not exist' });
        }
  
        // Generate a random password reset token
        const resetToken = Math.random().toString(36).slice(-8);
  
        // Update user's reset token and expiration time
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  
        await user.save();
  
        // Send email with reset link
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'kuber8821@gmail.com',
                pass: 'labf npll wsag tvop'
            }
        });
  
        const mailOptions = {
            from: 'kuber8821@gmail.com',
            to: email,
            subject: 'Password Reset Request',
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
                    Please click on the following link, or paste this into your browser to complete the process:\n\n
                    http://${req.headers.host}/reset/${resetToken}\n\n
                    If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };
  
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
  
        res.render('forget', { message: 'Check your email for password reset instructions' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
  });
  








module.exports = router;
