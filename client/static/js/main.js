$(function() {
    var baseURI = '/',
        socket  = io(),
        $container = $('#container');

    toastr.options = {
        "closeButton": true,
        "debug": false,
        "newestOnTop": false,
        "progressBar": false,
        "positionClass": "toast-bottom-right",
        "preventDuplicates": false,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    }

    var channel_id,
        channels,
        queue = [],
        tracklist = [];

    // ****************************
    // UUID SETUP
    // ****************************
    var uuid = localStorage.getItem('uuid');
    if (!uuid) {
        uuid = guid();
        localStorage.setItem('uuid', uuid);
    }

    function guid() {
        function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
        }
        return s4() + s4() + '-' + s4() + s4();
    }

    var default_channel = localStorage.getItem('channel');


    // ****************************
    // SOCKETS
    // ****************************
    socket.on('connect', function() {
        socket.emit('register', { uuid: uuid });
    });

    socket.on('channels.list', function(data) {
        channels = data;
        renderChannelList(data);
    });

    socket.on('channel.joined', function(data) {
        localStorage.setItem('channel', data.channel.channel_id);
        setupPlayer(data);

        // Get tracklist
        socket.emit('tracklist.list');
    });

    socket.on('artist.concert', function(data) {
        showConcert(data);
    });


    /*****************************************************************************
     *   
     *   HOMEPAGE
     *
     *****************************************************************************/


    // ****************************
    // TEMPLATES
    // ****************************
    var tmplChannelList = '<ul class="channels container row gutters">\
                                {{#each .}}\
                                    <li class="channel col span_6" data-channel-id="{{ channel_id }}">\
                                        <a href="#">\
                                            <div class="channel-image" style="background-image: url(\'/images/channels/{{ image }}\');"></div>\
                                            <h3>{{ channel }}</h3>\
                                        </a>\
                                    </li>\
                                {{/each}}\
                                <li class="channel channel--add-new col span_6">\
                                    <a href="#">\
                                        <div class="channel-image"></div>\
                                        <h3>New channel</h3>\
                                    </a>\
                                </li>\
                            </ul>';
    tmplChannelList = Handlebars.compile(tmplChannelList);


    function renderChannelList(channels) {
        // Is the user already set to a channel?
        var autojoin = false;
        if (default_channel) {
            $.each(channels, function(c) {
                if (channels[c].channel_id == default_channel) {
                    socket.emit('channel.join', default_channel);
                    autojoin = true;
                }
            });
        }

        var channelList = tmplChannelList(channels);
        $container.html(channelList);

        $('.channels .channel:not(.channel--add-new) a').on('click', function(e) {
            e.preventDefault();
            var $this = $(this),
                $parent = $(this).parent();
            $parent.siblings().addClass('channel--remove');
            $parent.addClass('channel--active');
            $this.children('.channel-image').append($('<div>', {'class': 'loader'}));

            setTimeout(function() {
                $parent.css({'position': 'absolute', 'top': $parent.offset().top, 'left': $parent.offset().left, 'width': $parent.width(), 'height': $parent.height()});
                $parent.siblings().remove();
                setTimeout(function() {
                    $parent.css({'left': ($(window).width() / 2) - ($parent.width() / 2)});
                }, 10);
            }, 50);

            // Connect to channel
            socket.emit('channel.join', $parent.data('channel-id'));
        });

        if (!autojoin) {
            setTimeout(function() {
                $('.channels').addClass('active');
            }, 250);
        }
    }



    var tmplConcert = '<a href="{{ concert.uri }}" target="_blank" class="concert">\
                            <strong>{{ concert.title }}</strong>\
                       </a>';
    tmplConcert = Handlebars.compile(tmplConcert);

    function showConcert(data) {
        var $concert = tmplConcert(data);
        $('body').append($concert);
    }

    function hideConcert() {
        $('.concert').fadeOut(function() { $(this).remove(); });
    }


    /*****************************************************************************
     *   
     *   PLAYER
     *
     *****************************************************************************/


    // ****************************
    // TEMPLATES
    // ****************************

    var tmplPlayerContainer = ' <div id="player">\
                                    <audio></audio>\
                                    <div id="sidebar">\
                                        <div class="sidebar-content">\
                                            <div class="tracklist-search">\
                                                <input type="text" placeholder="Search" autocomplete="off"/>\
                                                <i class="fa fa-search"></i>\
                                            </div>\
                                        </div>\
                                        <div class="sidebar-icons">\
                                            <div class="channel-info show-sidebar">\
                                                <div class="channel-quit"><i class="fa fa-chevron-left"></i></div>\
                                                <div class="channel-image" style="background-image: url(\'/images/channels/{{ channel.image }}\');"></div>\
                                                <div class="channel-info-details">\
                                                    <h3>{{ channel.channel }}</h3>\
                                                    <span class="channel-info-songs">{{ channel.songs }}</span> Songs |\
                                                    <span class="channel-info-listeners">{{ channel.listeners }}</span> Listeners\
                                                </div>\
                                            </div>\
                                            <i class="fa fa-volume-off toggle-mute"></i>\
                                            <span>Toggle mute</span>\
                                            <i class="fa fa-lastfm-square lastfm-scrobble {{#if scrobbling}}lastfm-scrobble-active{{/if}}"></i>\
                                            <span>Enable scrobbling</span>\
                                        </div>\
                                    </div>\
                                    \
                                    <div id="search">\
                                        <div class="search-container">\
                                            <input type="text" placeholder="Search" autocomplete="off"/>\
                                            <i class="fa fa-search"></i>\
                                        </div>\
                                    </div>\
                                    \
                                    <div class="track-container">\
                                        <div class="track-details">\
                                            <div class="album-art">\
                                                <img src="" alt=""/>\
                                                <div class="progress"></div>\
                                            </div>\
                                            <h1 class="track"></h1>\
                                            <h3 class="artist"></h3>\
                                        </div>\
                                        <div class="track-controls">\
                                            <span class="control control--like"><i class="fa fa-thumbs-up"></i><span class="count">0</span></span>\
                                            <span class="control control--dislike"><i class="fa fa-thumbs-down"></i><span class="count">0</span></span>\
                                        </div>\
                                    </div>\
                                </div>';
    tmplPlayerContainer = Handlebars.compile(tmplPlayerContainer);

    var tmplSearchResults = '<ul class="search-results">\
                                {{#each .}}\
                                    <li data-id="{{ id }}" {{#if added}}class="added"{{/if}}>\
                                    <img src="{{ image }}">\
                                    <i class="fa fa-plus"></i>\
                                    <h3>{{ track }}</h3>\
                                    <strong>{{ artist }}</strong></li>\
                                {{else}}\
                                    <li class="no-results">No search results</li>\
                                {{/each}}\
                            </ul>';
    tmplSearchResults = Handlebars.compile(tmplSearchResults);

    var tmplTrackList = '{{#if queue}}\
                         <h1>Queue</h1>\
                         <ul class="sidebar-queue">\
                             {{#each queue}}\
                                <li {{#if auto}}class="autoqueued"{{/if}}>\
                                    <a href="https://www.youtube.co.uk/watch?v={{ youtube }}" class="play-youtube" target="_blank">\
                                        <i class="fa fa-youtube-play"></i>\
                                    </a>\
                                    <strong>{{ track }}</strong> - {{ artist }}\
                                </li>\
                             {{/each}}\
                         </ul>\
                         {{/if}}\
                         <h1>Tracklist</h1>\
                         <ul class="sidebar-tracklist-letters">\
                            {{#each tracklist}}\
                                <li data-target-letter="{{ @ key }}">{{ @ key }}</li>\
                            {{/each}}\
                         </ul>\
                         <ul class="sidebar-tracklist">\
                             {{#each tracklist}}\
                                <li class="letter" data-letter="{{ @key }}">{{ @key }}</li>\
                                {{#each .}}\
                                    <li data-added="{{ added }}" data-up="{{ up }}" data-down="{{ down }}">\
                                        <a href="https://www.youtube.co.uk/watch?v={{ youtube }}" class="play-youtube" target="_blank">\
                                            <i class="fa fa-youtube-play"></i>\
                                        </a>\
                                        <a href="#" data-id="{{ id }}" class="queue-add">\
                                            <i class="fa fa-plus"></i>\
                                        </a>\
                                        <strong>{{ track }}</strong> - {{ artist }}</li>\
                                {{/each}}\
                             {{/each}}\
                         </ul>\
                         <div class="back-to-top"><i class="fa fa-chevron-up"></i></div>';
    tmplTrackList = Handlebars.compile(tmplTrackList);

    var tmplTrackListItem = '<li {{#if auto}}class="autoqueued"{{/if}}>\
                                <a href="https://www.youtube.co.uk/watch?v={{ youtube }}" class="play-youtube" target="_blank">\
                                    <i class="fa fa-youtube-play"></i>\
                                </a>\
                                <strong>{{ track }}</strong> - {{ artist }}\
                             </li>';
    tmplTrackListItem = Handlebars.compile(tmplTrackListItem);


    function setupPlayer(data) {
        $('body').removeClass('showing-sidebar');

        channel_id = data.channel.channel_id;

        data.scrobbling = scrobbling;

        // Build UI in background
        $container.append(tmplPlayerContainer(data));
        setupPlayerHandlers();

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

        $('.channel-quit i').css({'line-height': $('#player .channel-info').height() + 'px'});

        player = new Player();

        // Remove loader
        setTimeout(function() {
            $('.channels').fadeOut(function() {
                $(this).remove();

                $container.children('#player').addClass('active');

                if (data.track && data.position) {
                    player.play(data.track, data.position);
                }

                if (data.queue) {
                    queue = data.queue;
                }
            });
        }, 300);

        socket.on('channel.details', function(data) {
            if (data.listeners) {
                $container.find('.channel-info .channel-info-listeners').text(data.listeners);
            }
            if (data.songs) {
                $container.find('.channel-info .channel-info-songs').text(data.songs);
            }
        });
    }


    function setupPlayerHandlers() {
        // Sidebar
        $('.channel-quit').on('click', function(e) {
            default_channel = null;
            queue = [];
            tracklist = [];
            localStorage.removeItem('channel');
            renderChannelList(channels);
            socket.emit('channel.leave');
        });

        $('.show-sidebar').on('click', function(e) {
            if (!$('body').hasClass('showing-sidebar')) {
                renderTracklist(tracklist);
            } else {
                $('body').removeClass('showing-sidebar');
                $('#sidebar').removeClass('show-search');
            }
        });

        $('#sidebar').on('click', '.sidebar-tracklist-letters li', function(e) {
            e.preventDefault();

            var target = $(this).data('target-letter'),
                top = $('.sidebar-tracklist .letter[data-letter='+target+']').offset().top + 1;

            $('.sidebar-content').animate({ scrollTop: top }, 200);
        });

        $('#sidebar').on('click', 'li a.queue-add[data-id]', function(e) {
            e.preventDefault();

            socket.emit('playlist.queue', { id: $(this).data('id') });
        });

        $('#sidebar').on('click', '.back-to-top', function(e) {
            e.preventDefault();
            $('.sidebar-content').animate({ scrollTop: 0 }, 200);
        });

        $('#sidebar .sidebar-content').on('scroll', function() {
            if ($(this).scrollTop()) {
                $('#sidebar .back-to-top').fadeIn();
            } else {
                $('#sidebar .back-to-top').fadeOut();
            }
        });

        $('#sidebar').on('click', '.tracklist-search i', function(e) {
            e.preventDefault();
            $('#sidebar').toggleClass('show-search');

            $('.tracklist-search input').focus();
            if (!$('#sidebar').hasClass('show-search')) {
                renderTracklist(tracklist);
            }
        });

        $('#sidebar').on('keyup focus', '.tracklist-search input', function() {
            var q = $(this).val().toLowerCase();

            if (!q) {
                renderTracklist(tracklist);
                return;
            }

            // Loop tracklist and build new list of results
            var results = [];
            for (var trackID in tracklist) {
                track = tracklist[trackID];

                if (track.track.toLowerCase().indexOf(q) != -1 || track.artist.toLowerCase().indexOf(q) != -1) {
                    results.push(track);
                }
            }

            renderTracklist(results);
        });

        // LAST.FM Icon
        $('.lastfm-scrobble').on('click', function() {
            if ($(this).hasClass('lastfm-scrobble-active')) {
                $(this).removeClass('lastfm-scrobble-active');
                scrobbling = false;
                return;
            }

            // Start auth flow
            socket.emit('lastfm.auth');
        });

        // Search
        $('#search .search-container input').on('keyup', debounce(function(e) {
            var term = $(this).val();

            if (!term) {
                $('#search .search-results').hide();
                return;
            }

            socket.emit('track.search', { q: term});
        }, 250)).on('focus', function() {
            if ($('#search .search-results').length) {
                $('#search .search-results').show();
            }
        });

        $('#search').on('click', '.search-results li:not(.added)', function(e) {
            socket.emit('playlist.add', { id: $(this).data('id') });

            $(this).addClass('added');
        });

        $(document).on('click', function (e) {
            if ($(e.target).closest("#search").length === 0) {
                $("#search .search-results").hide();
            }
        });


        $('.track-controls .control').on('click', function(e) {
            if ($(this).hasClass('control-active')) {
                return;
            }

            var action = 'dislike';
            if ($(this).hasClass('control--like')) {
                action = 'like';
            }

            // Updated count - removed due to doubling
            // if (action == 'like') {
            //     $('.track-controls .control--like .count').text(parseInt($('.track-controls .control--like .count').text()) + 1).show();
            // } else {
            //     $('.track-controls .control--dislike .count').text(parseInt($('.track-controls .control--dislike .count').text()) + 1).show();
            // }

            // Did we rate oposite before
            if ($(this).siblings('.control').hasClass('control-active')) {
                $(this).siblings('.control').children('.count').text(parseInt($(this).siblings('.control').children('.count').text()) - 1);
                if (parseInt($(this).siblings('.control').children('.count').text()) == 0) {
                    $(this).siblings('.control').children('.count').hide();
                }
            }
            
            $(this).removeClass('control-deactive').addClass('control-active');
            $(this).siblings('.control').removeClass('control-active').addClass('control-deactive');


            var id = player.currentTrack.id;

            socket.emit('track.rate', { id: id, uuid: uuid, rating: (action == 'like')?1:-1 });
        });

        $('.toggle-mute').on('click', function(e) {
            if ($(this).hasClass('fa-volume-off')) {
                $(this).removeClass('fa-volume-off').addClass('fa-volume-up');
                player.player.volume = 1;
                player.player.play();
            } else {
                $(this).addClass('fa-volume-off').removeClass('fa-volume-up');
                player.player.volume = 0;
            }
            localStorage.setItem('volume', player.player.volume);
        });
    }




    // ****************************
    // SOCKETS
    // ****************************

    socket.on('track.added', function(data) {
        toastr["info"](data.track + ' - ' + data.artist, 'Added');
        tracklist.push(data);
    });

    socket.on('track.search', function(data) {
        $('#search .search-results').remove();
        renderSearchResults(data);
    });

    socket.on('track.queued', function(data) {
        // toastr["info"](data.track + ' - ' + data.artist, 'Queued');
        queue.push(data);
        if ($('body').hasClass('showing-sidebar')) {
            if ($('#sidebar .sidebar-queue').length) {
                $('#sidebar .sidebar-queue').append(tmplTrackListItem(data));
            } else {
                renderTracklist(tracklist);
            }
        }
    });

    socket.on('playlist.play', function(data) {
        player.play(data.track, data.position);

        // Hide concerts
        hideConcert();

        if (data.queue) {
            queue = data.queue;
        } else {
            // Is this the next thing in queue?
            if (queue && queue.length) {
                var queueLength = queue.length;
                for (var i = 0; i < queueLength; i++) {
                    if (queue[i].track === data.track.track && queue[i].artist === data.track.artist) {
                        queue = queue.slice(i+1);

                        // Remove items from queue list
                        $("#sidebar .sidebar-queue > li:lt("+(i+1)+")").slideUp(function() {
                            $(this).remove();

                            if (!$('.sidebar-queue li').length) {
                                $('#sidebar .sidebar-content > h1:eq(0)').remove();
                                $('.sidebar-queue').remove();
                            }
                        });

                        break;
                    }
                }
            }
        }
    });

    socket.on('playlist.preload', function(data) {
        player.preloadNext(data);

        // toastr["info"](data.track + ' - ' + data.artist, 'Queued');
        data.auto = true;
        queue.push(data);
        if ($('body').hasClass('showing-sidebar')) {
            if ($('#sidebar .sidebar-queue').length) {
                $('#sidebar .sidebar-queue').append(tmplTrackListItem(data));
            } else {
                renderTracklist(tracklist);
            }
        }
    });

    socket.on('track.rated', function(data) {
        // Update UI
        $('.track-controls .control--like .count').text(data.up).show();
        if (data.up < 1) {
            $('.track-controls .control--like .count').hide();
        }

        $('.track-controls .control--dislike .count').text(data.down).show();
        if (data.down < 1) {
            $('.track-controls .control--dislike .count').hide();
        }
    });

    var systemTrackList = false;
    socket.on('tracklist.list', function(data) {
        tracklist = data;
        //renderTracklist(data);
        systemTrackList = true; // Don't ask again
    });

    function nl2br(str, is_xhtml) {
        var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
        return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
    }


    // ****************************
    // SEARCH
    // ****************************
    function debounce(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };


    function renderSearchResults(data) {
        var $results = tmplSearchResults(data);
        $('#search').append($results).show();
    }



    // ****************************
    // LAST.FM
    // ****************************
    var scrobbling = false;

    // Listen for events
    socket.on('lastfm.authURL', function(url) {
        window.open(url, '_blank');
    });

    socket.on('lastfm.authorised', function(url) {
        scrobbling = true;
        $('.lastfm-scrobble').addClass('lastfm-scrobble-active');
    });

    function scrobbleSong() {
        if (scrobbling) {
            socket.emit('lastfm.scrobble');
        }
    }




    // ****************************
    // PLAYLIST
    // ****************************    
    function renderTracklist(data) {
        // Build and sort basic tracklist
        var tracks = [];
        for (var track in data) {
            tracks.push(data[track]);
        }
        tracks.sort(playlistSort);

        var tracklist = {};
        for (var trackID in tracks) {
            track = tracks[trackID];

            var letter = track.artist.replace(/^the /i,"")[0].toUpperCase();
            if (!/^[A-Z]$/.test(letter)) {
                letter = '#';
            }

            if (!(letter in tracklist)) {
                tracklist[letter] = [];
            }
            tracklist[letter].push(track);
        }

        // Remove previous playlist
        $('#sidebar .sidebar-content > :not(.tracklist-search)').remove();
        $('#sidebar .sidebar-content').append(tmplTrackList({tracklist: tracklist, queue: queue}));
        $('#sidebar .sidebar-content').scrollTop(0);

        $('body').addClass('showing-sidebar');
    }

    function playlistSort(a, b) {
        var o1 = a.artist.replace(/^the /i,"").toLowerCase();
        var o2 = b.artist.replace(/^the /i,"").toLowerCase();

        var p1 = a.track.toLowerCase();
        var p2 = b.track.toLowerCase();

        if (o1 < o2) return -1;
        if (o1 > o2) return 1;
        if (p1 < p2) return -1;
        if (p1 > p2) return 1;
        return 0;
    }


    // ****************************
    // PLAYER
    // ****************************    
    var Player = function(data) {
        var self = this;

        this.$player = $('audio');
        this.player = this.$player.get(0);

        this.$preloader = $('<audio>');
        this.preloader = this.$preloader.get(0);

        this.$progress = $('.track-details .progress');

        this.currentTrack;
        this.position = 0;

        // Mute player by default
        this.player.volume = 0;

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
                scrobbleSong();
            }
        });

        this.$player.on('canplay', function() {
            if (self.position) {
                self.player.currentTime = self.position;
                self.position = null;
            }
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

            $('.track-details .track').text(this.currentTrack.track);
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

});
