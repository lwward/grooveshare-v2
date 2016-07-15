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
        local            : {
            password     : String,
        },
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


// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.auth.local.password);
};


// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);