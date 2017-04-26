//jshint node: true, esversion: 6
'use strict';

// server.js
// main entry route for application

var express         = require('express'),
    app             = express(),
    pkg             = require('./package.json'),
    bp              = require('body-parser'),
    models          = require('./models'),
    bCrypt          = require('bcrypt-nodejs'),    
    os              = require('os'),
    flash           = require('connect-flash'),
    config          = require('./config'),
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
  secret: 'dfTJdsxcCrgc6565wfkw',
  resave: false,
  saveUninitialized: false,
  maxAge: 3600000 // 1 hour
}));

app.locals.date_format = '%D %b';
app.locals.season = config.year;

app.use(flash());

// authentication using passport.js
require('./auth')(app);

// routing
require('./routes')(app);

// populate a local variable with the list of teams
const season_key = 's' + config.year;
models.Team.findAll({ where: { [season_key]: 1 } }).then( data => { app.locals.dd_teams = data; });

// set up sequelize and start server listening
models.sequelize.sync().then(() => {
  console.log('Database Initialised');
  const server = app.listen(app.get('port'), () => {
    console.log(pkg.name, 'running on port', server.address().port);
  })
})
