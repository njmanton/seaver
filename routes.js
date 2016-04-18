'use strict';

var models    = require('./models'),
    moment    = require('moment'),
    passport  = require('passport');

module.exports = function(app) {

  var isAuthenticated = function (req, res, next) {
    if (req.isAuthenticated())
      return next();
    res.redirect('/login');
  }

  // home page
  app.get('/', function(req, res) {
    let start = moment('2016 04 11', 'YYYY MM DD'),
        now = moment();
    var week = (Math.floor(now.diff(start, 'days') / 7) + 1) || 1;
    models.Match.fixtures(models, week, 2016).then(function(data) {
      res.render('weeks', {
        title: 'This Week\'s Games',
        weeks: data
      })
    })
  })

  // login
  app.route('/login')
    .get(function(req, res) {
      res.render('login', {
        title: 'Login'
      })
    })
    .post(passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
      })
    );

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

  // get the standings
  // optionally add a year to get that year's table
  app.get('/standings/:season?', function(req, res) {
    models.Match.table(models, req.params.season).then(function(table) { 
      res.render('standings', {
        title: 'Standings',
        league: table,
        season: req.params.season || 2016
      })
    });
  })

  // get a team's result
  app.get('/teams/:id/:season?', function(req, res) {
    var team = models.Team.findById(req.params.id);
    var matches = models.Match.findAll({
      where: { $and: [{ season: req.params.season || app.locals.season }, { $or: [{ teama_id: req.params.id }, { teamb_id: req.params.id }] }] },
      raw: true,
      attributes: [
        'id',
        'score',
        'teama_id',
        'teamb_id',
        'round',
        [models.sequelize.fn('date_format', models.sequelize.col('date'), app.locals.date_format), 'date'],
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
    });
    models.sequelize.Promise.join(
      team,
      matches,
      function(team, matches) {
        team.logo = team.name.replace(/\s|\'/g, '').toLowerCase() + '.png';
        for (var x = 0; x < matches.length; x++) {
          var scores = [], result = null;
          if (matches[x].teama_id == req.params.id) {
            matches[x].home = true;
            matches[x].logo = matches[x]['TeamB.name'].replace(/\s|\'/g, '').toLowerCase() + '.png';
          } else {
            matches[x].home = false;
            matches[x].logo = matches[x]['TeamA.name'].replace(/\s|\'/g, '').toLowerCase() + '.png';
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
          } else {
            matches[x].score = '-';
          }
        }
        res.render('teams', {
          title: team.name,
          team: team,
          matches: matches
        })
      })
  })

  app.get('/weeks/:id?/:season?', function(req, res) {
    models.Match.fixtures(models, req.params.id, req.params.season).then(function(data) {
      res.render('weeks', {
        weeks: data
      })
    })
  })

  // handle the ajax POST of a result
  app.post('/matches/result', function(req, res) {
    
    if (req.user) {
      if (req.body.score.match(/[0-9]{1,2}-[0-9]{1,2}/)) {
        models.Match.update({
          score: req.body.score || null
        }, {
          where: [{ id: req.body.mid }, { season: 2016 }]
        }).then(function(rows) {
          res.send(rows == 1);
        }).catch(function(e) {
          res.send(e);
        })
      } else {
        res.send(false);
      }
      
    } else {
      res.sendStatus(403);
    }
  })

}