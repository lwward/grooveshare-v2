// Store base folder path
global.__base = __dirname + '/';

var fs = require('fs'),
    compression = require('compression'),
    express = require('express'),
    expressSession = require('express-session'),
    mongoStore = require('connect-mongo')(expressSession),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    helmet = require('helmet'),
    hbs = require('hbs'),
    app = express(),
    mongoose = require('mongoose'),
    passport = require('passport'),
    socket = require('./lib/socket.js'),
    flash = require('connect-flash'),
    channels = require('./lib/channels.js'),
    library = require('./lib/library.js');


// library.add('Sorry you\'re sick', 'Ted Hawkins');
// channels.create('Friday!');
// channels.addSong('metal-mash', 'Double nature', 'Mustasch').then(function() {
//     console.log('Woo we did it');
// }, function() {
//     console.log('Boo');
// });



// Check and load config
var config = require('./config/default.js');

// Create folder structure
if (!fs.existsSync('./data')){
    fs.mkdirSync('./data');
}

// Connect to MongoDB
mongoose.connect(config.storage.mongo.url);

// Listen to port
var server = app.listen(config.site.port, function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log('%s listening at http://%s:%s', config.site.title, host, port);
});


// Setup socket
socket = socket(server);

hbs.registerPartials(__dirname + '/client/views/partials');

app.set('view engine', 'hbs');
app.set('views', __dirname + '/client/views');

// GZIP
app.use(compression());

// Serve static files
app.use('/images', express.static('data/images'));
app.use('/music', express.static('data/music'));
app.use('/views', express.static('client/views'));
app.use(express.static('client/static'));

// Helmet
// app.use(helmet({dnsPrefetchControl: false}));
// app.use(helmet.contentSecurityPolicy({
//     directives: config.site.csp,
//     browserSniff: false
// }));

// Passport setup
app.use(cookieParser());
app.use(bodyParser());
app.use(expressSession({
    secret: 'u45lkhsfKJAS',
    store: new mongoStore({ mongooseConnection: mongoose.connection }),
    resave: true,
    saveUninitialized: true,
    httpOnly: true,
    name: 'groove'
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
require('./lib/passport')(passport);

// Setup default variables
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');

    res.locals = {}

    // Include user details if logged in
    if (req.user) {
        res.locals.user = req.user;
    }

    res.locals.title = config.site.title;

    // Set correct rendering layout based on request
    var layout = req.xhr ? false : 'layout';
    res.locals.layout = layout;

    next();
});

// Routes
require('./routes/auth')(app, passport);
require('./routes/site')(app);
