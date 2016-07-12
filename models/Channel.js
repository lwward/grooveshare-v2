var mongoose = require('mongoose'),
    autopopulate = require('mongoose-autopopulate'),
    Track = require('./Track.js'),
    ShortId = require('mongoose-shortid-nodeps'),
    utils = require('../lib/utils.js'),
    Schema = mongoose.Schema;

// define the schema for our user model
var channelSchema = mongoose.Schema({
    _id         : ShortId,
    title       : { type: String, index: true },
    slug        : { type: String, index: true },
    owner       : { type: String },
    created     : { type: Date, default: Date.now },
    public      : Boolean,
    tracks      : [{ type: Schema.ObjectId, ref: 'track', autopopulate: true }]
});

channelSchema.plugin(autopopulate);

channelSchema.pre('save', function(next){
    this.slug = utils.generateSlug(this.title);

    next();
});

module.exports = mongoose.model('channel', channelSchema);