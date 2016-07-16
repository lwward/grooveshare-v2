var path = require('path'),
    fs = require('fs'),
    colors = require('colors'),
    shortid = require('shortid'),
    library = require('./library.js');


var channel = function(channel) {
    var self = this;

    this.playing;
    this.queue = [];

    this.id = channel._id;
    this.title = channel.title;
    this.slug = channel.slug;

    this.listeners = 0;
    this.tracks = channel.tracks;

    // Start player
    if (this.tracks.length) {
        this.playNext();
    }

    return this;
};

channel.prototype.join = function(socket) {
    this.listeners++;
    socket.emit('channel.join', {
        id: this.id,
        title: this.title,
        slug: this.slug,
        listeners: this.listeners,
        tracks: this.tracks.length
    });
    socket.channel = this.id;
    socket.join(this.id);

    // Get them up to speed
    this.playing.position = this.getPosition();
    socket.emit('channel.play', this.playing);
}

channel.prototype.leave = function(socket) {
    this.channel = null;
    this.listeners--;
}

channel.prototype.tracklist = function(socket) {
    socket.emit('channel.tracklist', this.tracks);
}

channel.prototype.playNext = function() {
    // Get random track
    var track = this.getRandom();

    this.playing = {
        track: {
            id: track.id,
            title: track.title,
            artist: track.artist
        },
        started: Date.now()
    }

    // Tell everyone
    global.io.to(this.id).emit('channel.play', this.playing);

    // Setup timer
    var self = this;
    setTimeout(function() {
        self.playNext();
    }, track.meta.duration * 1000);

    console.log('%s %s %s - %s', '[channel]'.green, ('['+this.title+']').yellow, track.title, track.artist);
}

channel.prototype.getRandom = function() {
    return this.tracks[Math.floor(Math.random() * this.tracks.length)];
}

channel.prototype.getPosition = function() {
    if (!this.playing) return;
    return (Date.now() - this.playing.started) / 1000;
}

channel.prototype.queueSong = function(title, artist) {

}

module.exports = channel;