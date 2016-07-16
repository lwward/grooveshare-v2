var socketIO = require('socket.io'),
    channels = require('./channels.js');

module.exports = function(server) {
    this.io = global.io = socketIO.listen(server);
    console.log(typeof i != 'undefined' ? i : 'no');
    i = 'done';


    var connections = 0,
        listeners = [];

    io.on('connection', function(socket) {
        connections++;

        // Send channel list
        socket.emit('channels.list', channels.channels);

        socket.on('channel.addSong', function() {
            channels.addSong('metal-mash', 'Tender', 'Blur').then(function() {
                console.log('Woo we did it');
            }, function() {
                console.log('Boo');
            });
        });

        socket.on('channel.join', function(channelID) {
            // Does channel exist?
            var channel = channels.get(channelID);

            if (!channel) {
                socket.emit('channel.join', { 'error': 'Channel not found' });
                return;
            }

            channel.join(socket);
        });

        socket.on('channel.tracklist', function() {
            var channel = channels.get(socket.channel);

            if (channel) {
                channel.tracklist(socket);
            }
        });

        socket.onclose = function(reason) {
            if (socket.channel) {
                var channel = channels.get(socket.channel);
                socket.broadcast.to(socket.channel).emit('channel.details', { listeners: channel.listeners });
                channel.leave(socket);
            }
            Object.getPrototypeOf(this).onclose.call(this,reason);
        };

        socket.on('disconnect', function () {
            connections--;
        });

    });
}