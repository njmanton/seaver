'use strict';

var models    = require('./models'),
    passport  = require('passport');

module.exports = function(app) {

  var isAuthenticated = function (req, res, next) {
    if (req.isAuthenticated())
      return next();
    res.redirect('/login');
  }

  // home page
  app.get('/', function(req, res) {
    res.render('home', {
      title: 'Welcome'
    });
  })

  // login
  app.get('/login', function(req, res) {
    res.render('login', {
      title: 'Login'
    })
  })

  // process login
  app.post('/login', 
    passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/login',
    })
  )

  app.get('/logout', isAuthenticated, function(req, res) {
    req.logout();
    req.flash('message', 'User Logged Off');
    res.redirect('/');
  })

  // static pages
  app.get('/rules', function(req, res) {
    res.render('rules', {
      title: 'Rules'
    })
  })

  app.get('/format', function(req, res) {
    res.render('format', {
      title: 'League Format'
    })
  })

  app.get('/standings', function(req, res) {
    models.Match.table(models).then(function(table) {
      res.render('standings', {
        title: 'Standings',
        league: table
      })
    });
    //res.send('standings');
  })

  // get a team's result
  app.get('/teams/:id', function(req, res) {
    var team = models.Team.findById(req.params.id);
    var matches = models.Match.findAll({
      where: { $and: [{ season: 2015 }, { $or: [{ teama_id: req.params.id }, { teamb_id: req.params.id }] }] },
      raw: true,
      attributes: [
        'id',
        'score',
        'teama_id',
        'teamb_id',
        'round',
        [models.sequelize.fn('date_format', models.sequelize.col('date'), '%Y-%m-%d'), 'date'],
      ],
      include: [{
        model: models.Team,
        as: 'TeamA',
        attributes: ['name']
      }, {
        model: models.Team,
        as: 'TeamB',
        attributes: ['name']
      }]    
    });
    models.sequelize.Promise.join(
      team,
      matches,
      function(team, matches) {
        for (var x = 0; x < matches.length; x++) {
          var scores = [], result = null;
          if (matches[x].teama_id == req.params.id) {
            matches[x].home = true;
          } else {
            matches[x].home = false;
          }

          if (matches[x].score) {
            scores = matches[x].score.split('-').map(function(e) { return e * 1; });
            if (matches[x].home) {
              matches[x].cls = (scores[0] > scores[1]) ? 'win' : 'lose';
            } else {
              matches[x].cls = (scores[0] < scores[1]) ? 'win' : 'lose';
              // if selected team is 'away' then reverse the order of the score
              matches[x].score = matches[x].score.split('-').reverse().join('-');
            }
          }
        }
        res.render('teams', {
          title: team.name,
          team: team,
          matches: matches
        })
      })
  })

  // get a week's fixtures
  app.get('/weeks/:id', function(req, res) {
    models.Match.findAll({
      where: { $and: [{ round: req.params.id }, { season: 2016 }] },
      raw: true,
      attributes: [
        'id', 
        'score',
        'round',
        [models.sequelize.fn('date_format', models.sequelize.col('date'), '%Y-%m-%d'), 'date'],
      ],
      include: [{
        model: models.Team,
        as: 'TeamA',
        attributes: ['id', 'name']
      }, {
        model: models.Team,
        as: 'TeamB',
        attributes: ['id', 'name']
      }]    
    }).then(function(matches) {
      res.render('weeks', {
        title: 'Week ' + req.params.id,
        week: req.params.id,
        matches: matches
      })
    })
  })

  // handle the ajax POST of a result
  app.post('/matches/:id', function(req, res) {
    
    if (req.user) {
      models.Match.update({
        score: req.body.score
      }, {
        where: [{ id: req.params.id }, { season: 2016 }]
      }).then(function(rows) {
        res.send(rows == 1);
      })
    } else {
      res.sendStatus(403);
    }
  })

}