var config = require('../config/default.js'),
    LocalStrategy = require('passport-local').Strategy;
    TwitterStrategy = require('passport-twitter').Strategy,
    GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
    GithubStrategy = require('passport-github').Strategy,
    User = require('../models/User'),
    users = require('./users'),
    request = require('request');

module.exports = function(passport) {
    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            user.avatar = users.getProfileImage(user.email);
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL
    // =========================================================================
    passport.use('local-login', new LocalStrategy({
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true
    },
    function(req, username, password, done) {
        User.findOne({ 'username':  username }, function(err, user) {
            if (err) {
                return done(null, false, req.flash('error', 'An error occurred'));
            }

            // Check valid username
            if (!user) {
                return done(null, false, req.flash('error', 'Invalid login details'));
            }

            // Check valid password
            if (!user.validPassword(password)) {
                return done(null, false, req.flash('error', 'Invalid login details'));
            }

            return done(null, user);
        });
    }));

    passport.use('local-signup', new LocalStrategy({
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true
    },
    function(req, username, password, done) {
        process.nextTick(function() {
            User.findOne({ 'username' :  username }, function(err, user) {
                if (err) {
                    return done(null, false, req.flash('error', 'An error occurred'));
                }

                // check to see if theres already a user with that email
                if (user) {
                    return done(null, false, req.flash('error', 'Username not available'));
                } else {
                    // create the user
                    var newUser = new User();
                    newUser.username = username;
                    newUser.email = req.body.email;
                    newUser.auth.local.password = newUser.generateHash(password);

                    // save the user
                    newUser.save(function(err) {
                        if (err) {
                            return done(null, false, req.flash('error', 'An error occurred'));
                        }

                        // Notify user
                        // emailer.send(newUser.email);

                        return done(null, newUser);
                    });
                }
            });
        });
    }));


    // =========================================================================
    // TWITTER =================================================================
    // =========================================================================
    passport.use(new TwitterStrategy({
        consumerKey: config.auth.twitter.key,
        consumerSecret: config.auth.twitter.secret,
        includeEmail: true,
        passReqToCallback : true
    },
    function(req, token, tokenSecret, profile, done) {
        process.nextTick(function() {
            // console.log(profile);

            User.findOne({ 'auth.twitter.id' : profile.id }, function(err, user) {
                if (err) {
                    return done(err);
                }

                if (user) {
                    return done(null, user);
                } else {
                    // Create user
                    var newUser = new User();

                    newUser.username = profile.username;
                    newUser.auth.twitter.id = profile.id;
                    newUser.auth.twitter.token = token;

                    req.session.newUser = newUser;
                    return done();


                    // Don't save the user unless the username is fine
                    // newUser.save(function(err) {
                    //     if (err) {
                    //         throw done(err);
                    //     }
                    //     return done(null, newUser);
                    // });
                }
            });
        });
    }));


    // =========================================================================
    // GOOGLE ==================================================================
    // =========================================================================
    passport.use(new GoogleStrategy({
        clientID        : config.auth.google.ID,
        clientSecret    : config.auth.google.secret,
        callbackURL     : config.auth.google.callback,
        passReqToCallback : true
    },
    function(req, token, refreshToken, profile, done) {
        process.nextTick(function() {
            console.log(profile.id);
            User.findOne({ 'auth.google.id' : profile.id }, function(err, user) {
                if (err) {
                    return done(err);
                }

                if (user) {
                    return done(null, user);
                } else {
                    // Create user
                    var newUser          = new User();

                    newUser.username  = profile.displayName;
                    newUser.email = profile.emails[0].value;
                    newUser.auth.google.id = profile.id;
                    newUser.auth.google.token = token;
                    newUser.profile.gender = profile.gender;

                    req.session.newUser = newUser;
                    return done();
                }
            });
        });
    }));
};