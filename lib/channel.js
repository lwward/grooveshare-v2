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
    console.log(channel.title, this.tracks.length);
    if (this.tracks.length) {
        this.playNext();
    }

    return this;
};

channel.prototype.join = function(socket) {
    this.listeners++;
    console.log('%s New listener', '[channel]'.green);
    socket.emit('channel.join', {
        id: this.id,
        title: this.title,
        slug: this.slug,
        listeners: this.listeners,
        tracks: this.tracks.length
    });
    socket.join(this._id);

    // Get them up to speed
    this.playing.position = this.getPosition();
    socket.emit('channel.play', this.playing);
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
    global.io.to(this._id).emit('channel.play', this.playing);

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