var mongoose = require('mongoose'),
    ShortId = require('mongoose-shortid-nodeps');

// define the schema for our user model
var trackSchema = mongoose.Schema({
    _id         : ShortId,
    title       : { type: String, index: true },
    artist      : { type: String, index: true },
    album       : {
        title   : String
    },
    meta        : {
        lastfm  : String,
        mbid    : String,
        youtube : String
    }
});

module.exports = mongoose.model('track', trackSchema);