var mongoose = require('mongoose'),
    bcrypt   = require('bcrypt-nodejs'),
    twoFactor = require('node-2fa'),
    ShortId = require('mongoose-shortid-nodeps');

// define the schema for our user model
var userSchema = mongoose.Schema({
    _id         : ShortId,
    username    : { type: String,  unique: true },
    email       : { type: String,  unique: true },
    auth        : {
        facebook         : {
            id           : String,
            token        : String,
        },
        twitter          : {
            id           : String,
            token        : String,
        },
        google           : {
            id           : String,
            token        : String,
        },
        github           : {
            id           : String,
            token        : String,
        }
    }
});

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);