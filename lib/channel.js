var path = require('path'),
    fs = require('fs'),
    colors = require('colors'),
    shortid = require('shortid'),
    library = require('./library.js'),
    Channel = require('../models/Channel.js');


var channel = function(channel) {
    var self = this;

    this.id = channel._id;
    this.title = channel.title;
    this.slug = channel.slug;

    return this;
};


channel.prototype.join = function(socket) {
    console.log('%s New listener', '[channel]'.green);
    socket.emit('channel.join', this.title);
    socket.join(this._id);
}


channel.prototype.queueSong = function(title, artist) {

}

module.exports = channel;