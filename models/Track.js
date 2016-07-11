var mongoose = require('mongoose'),
    ShortId = require('mongoose-shortid-nodeps');

// define the schema for our user model
var trackSchema = mongoose.Schema({
    _id         : { type: ShortId, index: true },
    title       : { type: String },
    artist      : { type: String },
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