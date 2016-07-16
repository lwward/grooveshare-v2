var channels = require('../lib/channels.js');

module.exports = function(app) {

    // Homepage
    app.get('/', function(req, res, next) {
        if (!req.isAuthenticated()) {
            // Check if there is an unfinished user profile
            if (req.session.loginUser || req.session.newUser) {
                res.redirect('/auth');
                return;
            }
        }

        res.render('index', { channels: channels.channels, classes: ['index'] });
    });

    // Channel page
    app.get('/:channel', function(req, res, next) {
        var slug = req.params.channel;
        var channel = channels.get('fBiQ9Hu');

        if (!channel) {
            res.redirect('/');
            return;
        }

        // channel.join();

        res.render('channel', { channel: channel, classes: ['channel'] });
    });

};