// ****************************
// PLAYER
// ****************************    
var Player = function() {
    var self = this;

    this.$player = $('audio');
    this.player = this.$player.get(0);

    this.$preloader = $('<audio>');
    this.preloader = this.$preloader.get(0);

    this.$progress = $('.track-details .progress');

    this.currentTrack;
    this.position = 0;

    // Mute player by default
    this.player.volume = 1;

    // Check if user has unmuted previously
    if (localStorage.getItem('volume')) {
        this.player.volume = localStorage.getItem('volume');
        if (this.player.volume == 1) {
            $('.toggle-mute').removeClass('fa-volume-off').addClass('fa-volume-up');
        }
    }

    // Add event listeners
    this.$player.on('timeupdate', function() {
        var width = self.player.currentTime / self.player.duration * 100;
        self.$progress.width(width + '%');

        if (width > 50 && !self.halfWay) {
            self.halfWay = true;
            // scrobbleSong();
        }
    });

    this.$player.on('canplay', function() {
        if (self.position) {
            self.player.currentTime = self.position;
            self.position = null;
        }
        self.player.play();
    });

    this.preloadNext = function(track) {
        // Create new player to preload
        self.$preloader = $('<audio>');
        self.preloader = self.$preloader.get(0);

        self.$preloader.attr('autoplay', false);
        self.$preloader.attr('preload', 'auto');
        self.$preloader.attr('src', baseURI + 'music/' + track.id + '.mp3');

        self.preloader.volume = 0;
        self.preloader.load();
        self.preloader.play();
    }

    this.play = function(track, position) {
        this.currentTrack = track;

        this.position = position;
        this.halfWay = false;

        this.$progress.width('0%');

        $('.track-details .track').text(this.currentTrack.title);
        $('.track-details .artist').text(this.currentTrack.artist);


        // Set ratings
        $('.track-controls .control--like').removeClass('control-active').removeClass('control-deactive');
        $('.track-controls .control--dislike').removeClass('control-active').removeClass('control-deactive');
        if (track.up) {
            $('.track-controls .control--like .count').text(track.up).show();
        } else {
            $('.track-controls .control--like .count').text(0).hide();
        }
        if (track.up_uuid) {
            var u = track.up_uuid.split(',');
            if (u.indexOf(uuid) > -1) {
                $('.track-controls .control--like').addClass('control-active');
                $('.track-controls .control--dislike').addClass('control-deactive');
            }
        }
        if (track.down) {
            $('.track-controls .control--dislike .count').text(track.down).show();
        } else {
            $('.track-controls .control--dislike .count').text(0).hide();
        }
        if (track.down_uuid) {
            var u = track.down_uuid.split(',');
            if (u.indexOf(uuid) > -1) {
                $('.track-controls .control--dislike').addClass('control-active');
                $('.track-controls .control--like').addClass('control-deactive');
            }
        }

        // Remove current album art
        $('.track-details img').attr('src', '');
        $('<img>', {src: this.currentTrack.image}).on('load', function() {
            $('.track-details img').attr('src', self.currentTrack.image);
        });

        // Remove current background
        $('body').attr('style', '');

        // Set page background
        var bg = '/music/images/' + this.currentTrack.artist.replace(/[^a-z0-9]/gi, '-').toLowerCase() + '.png';
            css = 'radial-gradient(ellipse at center, rgba(40,40,40,0.8) 0%,rgba(14,14,14,1) 100%), url("'+bg+'")';

        $('<img>', {src: bg}).on('load', function() {
            $('body').css({'background': css, 'background-size': 'cover', 'background-position': 'center'});
        });

        this.$player.attr('src', baseURI + 'music/' + this.currentTrack.id + '.mp3');
        // this.player.load();
        this.player.play();

        this.newSong = true;
    }


    return this;
}
