var path = require('path'),
    fs = require('fs'),
    colors = require('colors'),
    shortid = require('shortid'),
    Track = require('../models/Track.js'),
    downloader = require('./downloader.js');


var library = {
    tracks: [],

    setup: function() {
        var self = this;

        Track.find().then(function(tracks) {
            console.log('%s Loading %d tracks...', '[library]'.green, tracks.length);

            tracks.forEach(function(track) {
                track.path = self.generatePath(track);

                self.verify(track).then(function() {
                    self.tracks.push(track);
                }, function(error) {
                    // Call downloader
                    downloader.get(track).then(function() {
                        self.tracks.push(track);
                    }, function(error) {
                        console.log('%s Error downloding file', '[library]'.green, error);
                    });
                });
            });
        });
    },

    add: function(title, artist, album) {
        var self = this;

        // Check if song is already included
        Track.findOne({ title: title, artist: artist }).then(function(result) {

            if (result) {
                // Track already exists
                console.log('%s %s - %s already exists', '[library]'.green, title, artist);

                return;
            }

            console.log('%s Adding %s - %s', '[library]'.green, title, artist);

            // Create object
            var track = new Track({
                    _id: shortid.generate(),
                    title: title,
                    artist: artist,
                    album : {
                        title: album
                    }
                });
            
            track.path = self.generatePath(track);

            downloader.get(track).then(function() {
                self.tracks.push(track);
                console.log('%s %s - %s added', '[library]'.green, track.title, track.artist);
                track.save();
            }, function(error) {
                console.log('%s Error downloding file - %s', '[library]'.green,  error);
            });

        });
    },

    verify: function(track) {
        var self = this;

        return new Promise(function(resolve, reject) {

            // Do we have the track?
            fs.exists(track.path, function(exists) { 
                if (exists) { 
                    resolve();
                } else {
                    reject('File not found');
                }
            });

        });
    },


    generatePath: function(track) {
        return path.join(global.__base, 'data', 'music', track._id + '.mp3');
    }

}

library.setup();

module.exports = library;