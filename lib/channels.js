var path = require('path'),
    fs = require('fs'),
    colors = require('colors'),
    shortid = require('shortid'),
    library = require('./library.js'),
    Channel = require('../models/Channel.js');


var channels = {

    channels: [],

    setup: function() {
        // Load channels
        var self = this;

        Channel.find().then(function(channels) {
            self.channels = channels;

            console.log('%s Setup %d channels', '[channels]'.green, channels.length);

            // var track = library.add('Graceland', 'Paul Simon');
            // console.log(track);

            // self.channels[0].tracks.push('S1xKXHev');
            // self.channels[0].save().then(function() {
            //     console.log('Saved');
            // }, function(err) {
            //     console.log('Error ', err);
            // });
        });
    },

    add: function(title) {
        var channel = new Channel({
            title: title
        });

        channel.save();

        console.log(channel);

        this.channels.push(channel);
    }

}

channels.setup();

module.exports = channels;