var utils = require('../lib/utils.js'),
    // tokenStore = require('../lib/tokenStore.js'),
    users = require('../lib/users.js'),
    User = require('../models/User');
    // emailer = require('../lib/emailer');

var extra = {
    classes: ['auth']
}

module.exports = function(app, passport) {

    app.get('/auth', utils.isNotAuthenticated, function(req, res) {
        if (req.session.newUser) {
            // Handle new users setting up their account
            res.render('auth/setup', {
                newUser: req.session.newUser,
                extra: extra
            }); 
        } else {
            res.render('auth', { login: { message: req.flash('error') }, extra: extra }); 
        }
    });
    // Password recovery
    app.post('/auth/forgot', utils.isNotAuthenticated, function(req, res, next) {
        if (req.body.forgot) {
            // Find user
            User.findOne({ $or: [{'username' : req.body.forgot}, {'email' : req.body.forgot}] }, function(err, user) {
                if (user) {
                    tokenStore.generate(user._id, 'request', 15*60).then(function(token) {
                        emailer.send();
                    }).then(function(msg) {
                        // Flash message
                        req.flash('error', 'Email has been sent to the registered email address.');
                        res.redirect('/auth'); // Redirect to auth
                    }, function(msg) {
                        req.flash('error', 'Error sending email');
                    });
                } else {
                    req.flash('error', 'No user found.');
                }
            });
        } else {
            req.flash('error', 'Username missing.');
        }
        
        res.redirect('/auth');
    });

    app.all('/auth/forgot', utils.isNotAuthenticated, function(req, res) {
        res.render('auth/forgot', { message: req.flash('error'), extra: extra }); 
    });

    // Finalize account
    app.post('/auth', utils.isNotAuthenticated, function(req, res, next) {
        if (req.session.newUser) {
            var username = req.body.username;
            var email = req.body.email;
            if (username) {
                // Check username is available
                users.checkUsername(username, function(valid) {
                    if (valid) {
                        var newUser = new User();
                        newUser.username = username;
                        newUser.email = email;
                        newUser.profile = req.session.newUser.profile;
                        newUser.auth = req.session.newUser.auth;

                        newUser.save(function(err) {
                            if (err) {
                                console.log(err);
                            } else {
                                req.login(newUser, function(err) {
                                    if (err) { return next(err); }
                                    delete req.session.newUser;
                                    return res.redirect('/course');
                                });
                            }
                        });

                    } else {
                        res.render('auth-setup', { username: username, message: valid?'perfect':'Username is not available', extra: extra });
                    }
                });
            } else {
                res.render('auth-setup', { username: req.session.newUser.username, extra: extra });
            }
        } else {
            next(); // Continue to passport authentication
        }
    });

    // Login
    app.post('/auth', utils.isNotAuthenticated, passport.authenticate('local-login', {
        successRedirect : '/course',
        failureRedirect : '/auth',
        failureFlash : true,
        failWithError: true
    }));

    app.get('/auth/signup', utils.isNotAuthenticated, function(req, res) {
        res.render('auth', { signup: { message: req.flash('error') }, extra: extra }); 
    });

    app.post('/auth/signup', utils.isNotAuthenticated, passport.authenticate('local-signup', {
        successRedirect : '/course',
        failureRedirect : '/auth/signup',
        failureFlash : true
    }));

    // Twitter
    app.get('/auth/twitter', utils.isNotAuthenticated, passport.authenticate('twitter', { scope : ['profile', 'email'] }));
    app.get('/auth/twitter/callback', utils.isNotAuthenticated, passport.authenticate('twitter', {
        successRedirect : '/course',
        failureRedirect : '/'
    }));

    // Google
    app.get('/auth/google', utils.isNotAuthenticated, passport.authenticate('google', { scope : ['profile', 'email'] }));
    app.get('/auth/google/callback', utils.isNotAuthenticated, passport.authenticate('google', {
        successRedirect : '/course',
        failureRedirect : '/'
    }));

    // Github
    app.get('/auth/github', utils.isNotAuthenticated, passport.authenticate('github'));
    app.get('/auth/github/callback', utils.isNotAuthenticated, passport.authenticate('github', {
        successRedirect : '/course',
        failureRedirect : '/'
    }));

    // Logout
    app.get('/auth/logout', function(req, res) {
        if (req.session.loginUser || req.session.newUser) {
            delete req.session.loginUser;
            delete req.session.newUser;
            res.redirect('/auth');
        } else {
            req.logout();
            res.redirect('/');
        }
    });

};