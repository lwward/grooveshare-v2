$(function() {
    var baseURI = '/',
        socket  = io(),
        $container = $('#container');  


    socket.on('channels.list', function(data) {
        channels = data;
        if (!$('#player').length) {
            renderChannelList(data);
        }
    });


    socket.on('channel.play', function(data) {
        console.log(data);
    });


    var tmplChannelList = '<ul class="channels container row gutters">\
                                {{#each .}}\
                                    <li class="channel col span_6" data-channel-id="{{ id }}" data-channel-slug="{{ slug }}">\
                                        <a href="#">\
                                            <div class="channel-image" style="background-image: url(\'/images/channels/{{ id }}.jpg\');"></div>\
                                            <h3>{{ title }}</h3>\
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
        console.log(channels);

        var channelList = tmplChannelList(channels);
        $container.html(channelList);

        // Click handlers
        $('.channels .channel:not(.channel--add-new) a').on('click', function(e) {
            e.preventDefault();
            var $this = $(this),
                $parent = $(this).parent();
            $parent.siblings().addClass('channel--remove');
            $parent.addClass('channel--active');
            $this.children('.channel-image').append($('<div>', {'class': 'loader'}));

            var title = $this.children('h3').text(),
                slug = $parent.data('channel-slug');

            setTimeout(function() {
                $parent.css({'position': 'absolute', 'top': $parent.offset().top, 'left': $parent.offset().left, 'width': $parent.width(), 'height': $parent.height()});
                $parent.siblings().remove();
                setTimeout(function() {
                    $parent.css({'left': ($(window).width() / 2) - ($parent.width() / 2)});
                }, 10);

                document.title = title + ' | Grooveshare';
                window.history.pushState({"url": slug, "pageTitle": document.title}, "", slug);
            }, 50);

            // Connect to channel
            socket.emit('channel.join', $parent.data('channel-id'));
        });

        setTimeout(function() {
            $('.channels').addClass('active');
        }, 250);
    }

});