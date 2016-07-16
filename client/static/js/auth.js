$(function() {
    var height = $('.auth-local > .active').height();
    $('.auth-local').height(height);

    $('.auth-tabs li').on('click', function() {
        $(this).addClass('active');
        $(this).siblings().removeClass('active');

        // Show correct tab
        $('.auth-local > .active').removeClass('active');
        $('.auth-local').children('.'+$(this).data('target')).addClass('active');

        var height = $('.auth-local > .active').height();
        $('.auth-local').height(height);

        var url = '/auth';
        if ($(this).data('target') == 'auth-local-signup') {
            url += '/signup';
        }
        window.history.pushState({}, "", url);
    });
});