$(function() {
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


});