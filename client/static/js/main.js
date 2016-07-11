$(function() {
    var baseURI = '/',
        socket  = io(),
        $container = $('#container');  


    socket.on('channels.list', function(data) {
        channels = data;
        renderChannelList(data);
    });


    var tmplChannelList = '<ul class="channels container row gutters">\
                                {{#each .}}\
                                    <li class="channel col span_6" data-channel-id="{{ _id }}">\
                                        <a href="#">\
                                            <div class="channel-image" style="background-image: url(\'/images/channels/{{ _id }}.jpg\');"></div>\
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

        setTimeout(function() {
            $('.channels').addClass('active');
        }, 250);
    }

});