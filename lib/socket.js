var socketIO = require('socket.io');

module.exports = function(server) {
    this.io = socketIO.listen(server);
    console.log(typeof i != 'undefined' ? i : 'no');
    i = 'done';


    var connections = 0,
        listeners = [];

    io.on('connection', function(socket) {
        connections++;

        socket.onclose = function(reason) {
            if (socket.channel) {
                var channel = channels[socket.channel];
                socket.leave('#' + socket.channel);
                socket.broadcast.to('#' + socket.channel).emit('channel.details', { listeners: channel.getListeners() });
            }
            Object.getPrototypeOf(this).onclose.call(this,reason);
        };

        socket.on('disconnect', function () {
            connections--;
        });

    });
}