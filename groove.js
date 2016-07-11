// Store base folder path
global.__base = __dirname + '/';

var compression = require('compression'),
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
    config = require('./config/default.js'),
    library = require('./lib/library.js'),
    channels = require('./lib/channels.js');


// library.add('Graceland', 'Paul Simon');
// channels.add('Metal mash');

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

    next();
});

// Routes
require('./routes/site')(app);
