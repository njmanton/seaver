var express         = require('express'),
    app             = express(),
    pkg             = require('./package.json'),
    bp              = require('body-parser'),
    models          = require('./models'),
    bCrypt          = require('bcrypt-nodejs'),
    flash           = require('connect-flash'),
    expressSession  = require('express-session'),
    bars            = require('express-handlebars');

// handlebars as templating engine
app.engine('.hbs', bars({
  defaultLayout: 'layout', extname: '.hbs'
}));
app.set('view engine', '.hbs');

// set static route
app.use(express.static('assets'));

// body-parsing for post requests
app.use(bp.urlencoded({ 'extended': false }));
app.use(bp.json());

app.set('port', process.env.PORT || 1969); // a good year for seaver

app.use(expressSession({
  secret: 'dfTJdscrgc56wfkw',
  resave: false,
  saveUninitialized: false,
  maxAge: 3600000 // 1 hour
}));

app.use(flash());

// authentication using passport.js
require('./auth')(app);

// routing
require('./routes')(app);

// set up sequelize and start server listening
models.sequelize.sync().then(function() {
  console.log('Databases Initialised');
  var server = app.listen(app.get('port'), function() {
    console.log(pkg.name, 'running on port', server.address().port);
  })
})

