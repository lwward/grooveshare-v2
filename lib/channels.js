var path = require('path'),
    fs = require('fs'),
    colors = require('colors'),
    shortid = require('shortid'),
    library = require('./library.js'),
    channel = require('./channel.js')
    Channel = require('../models/Channel.js');


var channels = {

    channels: {},

    setup: function() {
        // Load channels
        var self = this;

        Channel.find().then(function(results) {
            results.forEach(function(result) {
                var tempChannel = new channel(result);
                self.channels[result._id] = tempChannel;
            });

            console.log('%s Setup %d channels', '[channels]'.green, results.length);
        });
    },

    create: function(title) {
        var channel = new Channel({
            title: title
        });

        channel.save();

        this.channels[channel._id] = channel;
    },

    get: function(id) {
        if (id in this.channels) {
            return this.channels[id];
        }
    },

    addSong: function(slug, title, artist) {
        return new Promise(function(resolve, reject) {

            Channel.findOne({ slug: slug }).then(function(channel) {
                if (!channel) {
                    reject('Channel not found');
                    return;
                }

                library.add(title, artist).then(function(track) {
                    // Is this song already in the channel?
                    for(var i = 0; i < channel.tracks.length; i++) {
                        if (channel.tracks[i]._id == track._id) {
                            resolve('Track already in playlist');
                            return;
                        }
                    }

                    channel.tracks.push(track._id);

                    channel.save().then(function() {
                        console.log('%s %s Added %s - %s', '[channels]'.green, ('['+channel.title+']').yellow, track.title, track.artist);
                        resolve('Track added');
                    }, function(error) {
                        console.log('%s %s Error %s - %s', '[channels]'.green, ('['+channel.title+']').yellow, error);
                        reject(error);
                    });
                }, function(error) {
                    console.log('%s %s Error %s - %s', '[channels]'.green, ('['+channel.title+']').yellow, error);
                    reject(error);
                });

            });

        });
    }

}

channels.setup();

module.exports = channels;