function channel(id) {
    var self = this;

    this.tracklist = [];

    // Connect to channel
    socket.emit('channel.join', id);

    socket.on('channel.join', function(data) {
        self.render(data);

        // Get tracklist
        socket.emit('channel.tracklist');
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

    socket.on('channel.tracklist', function(data) {
        self.tracklist = data;
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

    var tmplTrackList = Handlebars.getTemplate('channel-tracklist');
    this.renderTracklist = function() {
        // Build and sort basic tracklist
        var tracks = [];
        for (var track in this.tracklist) {
            tracks.push(this.tracklist[track]);
        }
        tracks.sort(playlistSort);

        var tracklist = {};
        for (var trackID in tracks) {
            track = tracks[trackID];

            console.log(track);

            var letter = track.artist.replace(/^the /i,"")[0].toUpperCase();
            if (!/^[A-Z]$/.test(letter)) {
                letter = '#';
            }

            if (!(letter in tracklist)) {
                tracklist[letter] = [];
            }
            tracklist[letter].push(track);
        }

        console.log(tracklist);

        $('#sidebar .sidebar-content > :not(.tracklist-search)').remove();
        $('#sidebar .sidebar-content').append(tmplTrackList({tracklist: tracklist, queue: []}));
        $('#sidebar .sidebar-content').scrollTop(0);

        $('body').addClass('showing-sidebar');
    }

    function playlistSort(a, b) {
        var o1 = a.artist.replace(/^the /i,"").toLowerCase();
        var o2 = b.artist.replace(/^the /i,"").toLowerCase();

        var p1 = a.title.toLowerCase();
        var p2 = b.title.toLowerCase();

        if (o1 < o2) return -1;
        if (o1 > o2) return 1;
        if (p1 < p2) return -1;
        if (p1 > p2) return 1;
        return 0;
    }



}