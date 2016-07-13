var path = require('path'),
    fs = require('fs'),
    colors = require('colors'),
    socketIO = require('socket.io'),
    shortid = require('shortid'),
    library = require('./library.js'),
    Channel = require('../models/Channel.js');


var channel = function(channel) {
    var self = this;

    this.playing;
    this.queue = [];

    this.id = channel._id;
    this.title = channel.title;
    this.slug = channel.slug;

    this.listeners = 'X';
    this.tracks = channel.tracks;

    // Start player
    if (this.tracks.length) {
        this.play();
    }

    return this;
};

channel.prototype.join = function(socket) {
    console.log('%s New listener', '[channel]'.green);
    socket.emit('channel.join', channel);
    socket.join(this._id);
}


channel.prototype.play = function() {
    // Get random track
    var track = this.getRandom();

    this.playing = track;

    console.log('%s %s %s - %s', '[channel]'.green, ('['+this.title+']').yellow, track.title, track.artist);
}

channel.prototype.getRandom = function() {
    return this.tracks[Math.floor(Math.random() * this.tracks.length)];
}

channel.prototype.checkProgress = function() {
    if (!this.playing) return;
    return (Date.now() - this.playing.started) / 1000;
}


channel.prototype.queueSong = function(title, artist) {

}

module.exports = channel;