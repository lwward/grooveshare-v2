var utils = {

    generateSlug: function(text) {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    },

    isAuthenticated: function(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }

        // Store where they were trying to go
        req.session.redirect = req.path;

        req.flash('error', 'Login required to access content');
        res.redirect('/auth');
    },

    isNotAuthenticated: function(req, res, next) {
        if (req.isAuthenticated()) {
            res.redirect('/');
            return;
        }
        
        return next();
    }

}


module.exports = utils;