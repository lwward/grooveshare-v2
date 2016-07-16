var baseURI = '/',
    socket  = io(),
    $container = $('#container');

$(function() {
    Handlebars.getTemplate = function(name) {
        if (Handlebars.templates === undefined || Handlebars.templates[name] === undefined) {
            $.ajax({
                url : 'views/' + name + '.hbs',
                success : function(data) {
                    if (Handlebars.templates === undefined) {
                        Handlebars.templates = {};
                    }
                    Handlebars.templates[name] = Handlebars.compile(data);
                },
                async : false
            });
        }
        return Handlebars.templates[name];
    };

    if ($('body').hasClass('index')) {
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
                // window.history.pushState({"url": slug, "pageTitle": document.title}, "", slug);
            }, 50);

            new channel($parent.data('channel-id'));
        });
    }

});