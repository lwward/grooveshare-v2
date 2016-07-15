var utils = require('./utils.js'),
    gravatar = require('gravatar');

var users = {
    checkUsername: function(username, callback) {
        User.findOne({ 'username' : username }, function(err, user) {
            callback(!user);
        });
    },

    getProfileImage: function(email, width, height, force) {
        // Try gravatar
        return gravatar.url(email, {s: '100', r: 'x', d: 'identicon'}, true);
    }
}

module.exports = users;