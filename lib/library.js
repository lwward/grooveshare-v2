var path = require('path'),
    fs = require('fs'),
    shortid = require('shortid'),
    Track = require('../models/Track.js'),
    downloader = require('./downloader.js');


var library = {

    tracks: [],

    setup: function() {
        var self = this;

        Track.find().then(function(tracks) {
            console.log('Loading %d tracks...', tracks.length);

            tracks.forEach(function(track) {
                track.path = self.generatePath(track);

                self.verify(track).then(function() {
                    self.tracks.push(track);
                    console.log('Loaded %s - %s', track.title, track.artist);
                }, function(error) {
                    console.log(error);

                    // Call downloader
                    downloader.get(track).then(function() {
                        self.tracks.push(track);
                        console.log('Downloaded %s - %s', track.title, track.artist);
                    }, function(error) {
                        console.log('Error downloding file', error);
                    });
                });
            });
        });
    },

    add: function(title, artist, album) {
        var self = this;
        // Check if song is already included

        console.log('Adding %s - %s', title, artist);

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
            console.log('%s - %s added to library', track.title, track.artist);
            track.save();
        }, function(error) {
            console.log('Error downloding file', error);
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