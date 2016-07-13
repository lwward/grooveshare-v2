var channels = require('../lib/channels.js');

module.exports = function(app) {

    // Homepage
    app.get('/', function(req, res, next) {
        res.render('index');
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

        res.render('channel', { channel: channel });
    });

};