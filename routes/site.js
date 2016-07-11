module.exports = function(app) {

    // Homepage
    app.get('/', function(req, res, next) {
        res.render('index');
    });

};