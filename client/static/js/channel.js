function channel(id) {
    var self = this;

    // Connect to channel
    socket.emit('channel.join', id);

    socket.on('channel.join', function(data) {
        console.log('Joined', data);
        self.render(data);
    });

    socket.on('channel.play', function(data) {
        if (self.player) {
            self.player.play(data.track, data.position);
        } else {
            setTimeout(function() {
                self.player.play(data.track, data.position);
            }, 100);
        }
    });

    this.render = function(data) {
        var compiledTemplate = Handlebars.getTemplate('channel');
        var html = compiledTemplate(data);

        $container.append(html);
        this.player = new Player();

        // Resize channel card
        var cardwidth = $('#player .channel-info').width(),
            cardheight = $('#player .channel-info').height();

        while (cardwidth > 150) {
            $('#player .channel-info').width(--cardwidth);
            if ($('#player .channel-info').height() > cardheight) {
                $('#player .channel-info').width(++cardwidth);
                break;
            }
        }

        // Remove loader
        setTimeout(function() {
            $('.channels').fadeOut('slow', function() {
                $(this).remove();

                setTimeout(function() {
                    $container.children('#player').addClass('active');
                }, 500);
            });
        }, 300);

        this.setupHandlers();
    }

    this.setupHandlers = function() {
        var self = this;
        $('.show-sidebar').on('click', function(e) {
            if (!$('body').hasClass('showing-sidebar')) {
                self.renderTracklist();
            } else {
                $('body').removeClass('showing-sidebar');
                $('#sidebar').removeClass('show-search');
            }
        });

        $('.toggle-mute').on('click', function(e) {
            if ($(this).hasClass('fa-volume-off')) {
                $(this).removeClass('fa-volume-off').addClass('fa-volume-up');
                self.player.player.volume = 1;
                self.player.player.play();
            } else {
                $(this).addClass('fa-volume-off').removeClass('fa-volume-up');
                self.player.player.volume = 0;
            }
            localStorage.setItem('volume', self.player.player.volume);
        });
    }



    this.renderTracklist = function(tracklist) {
        $('#sidebar .sidebar-content > :not(.tracklist-search)').remove();
        // $('#sidebar .sidebar-content').append(tmplTrackList({tracklist: tracklist, queue: queue}));
        $('#sidebar .sidebar-content').scrollTop(0);

        $('body').addClass('showing-sidebar');
    }


}