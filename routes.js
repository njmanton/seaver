//jshint node: true, esversion: 6
'use strict';

var models    = require('./models'),
    moment    = require('moment'),
    config    = require('./config'),
    passport  = require('passport');

const routes = app => {

  var isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated())
      return next();
    res.redirect('/login');
  }

  // home page
  app.get('/', (req, res) => {
    let start = moment('2016 06 27', 'YYYY MM DD'),
        now = moment();
    var week = (Math.floor(now.diff(start, 'days') / 7) + 10) || -1;
    models.Match.fixtures(models, week, config.year).then(data => {
      if (data.length) {
        res.render('weeks', {
          title: 'This Week\'s Games',
          weeks: data
        })
      } else {
        models.Match.table(models, config.year).then(table => { 
          res.render('standings', {
            title: 'Standings',
            league: table,
            season: config.year
          })
        });
      }

    })
  })

  // login
  app.route('/login')
    .get((req, res) => {
      res.render('login', {
        title: 'Login'
      })
    })
    .post(passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
      })
    );

  app.get('/logout', isAuthenticated, (req, res) => {
    req.logout();
    req.flash('message', 'User Logged Off');
    res.redirect('/');
  })

  // static pages
  app.get('/rules', (req, res) => {
    res.render('rules', {
      title: 'Rules'
    })
  })

  app.get('/format', (req, res) => {
    res.render('format', {
      title: 'League Format'
    })
  })

  app.get('/unplayed', (req, res) => {
    
    let start = moment(config.first_week, 'YYYY MM DD'),
        now = moment();
    var week = (Math.floor(now.diff(start, 'days') / 7) + 1) || 1;
    models.Match.findAll({
      order: ['round'],
      attributes: ['id', 'round', 'round', 'score'],
      where: [{ score: null }, { round: { $lte: week } }, { season: config.year }],
      include: [{
        model: models.Team,
        as: 'TeamA',
        attributes: ['id', 'name']
      }, {
        model: models.Team,
        as: 'TeamB',
        attributes: ['id', 'name']
      }]
    }).then(games => {
      games.map(m => { 
        m.TeamA.logo = m.TeamA.name.replace(/\s|\'/g, '').toLowerCase() + '.png';
        m.TeamB.logo = m.TeamB.name.replace(/\s|\'/g, '').toLowerCase() + '.png' }
      )
      res.render('unplayed', {
        title: 'Unplayed Games',
        fixtures: games
      })
    })
  })

  // get the standings
  // optionally add a year to get that year's table
  app.get('/standings/:season?', (req, res) => {
    models.Match.table(models, req.params.season).then(table => { 
      res.render('standings', {
        title: 'Standings',
        league: table,
        season: req.params.season || config.year
      })
    });
  })

  // get a team's result
  app.get('/teams/:id/:season?', (req, res) => {
    var team = models.Team.findById(req.params.id);
    var matches = models.Match.findAll({
      where: { $and: [{ season: req.params.season || app.locals.season }, 
             { $or: [{ teama_id: req.params.id }, { teamb_id: req.params.id }] }] },
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
    models.sequelize.Promise.join(team, matches, (team, matches) => {
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
          scores = matches[x].score.split('-').map(e => { return e * 1; });
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

  app.get('/weeks/:id?/:season?', (req, res) => {
    models.Match.fixtures(models, req.params.id, req.params.season).then(data => {
      res.render('weeks', {
        title: (req.params.id) ? 'LCSSL Week ' + req.params.id : 'LCSSL Fixtures',
        weeks: data
      })
    })
  })

  // handle an email submitted to results@lcssl.org
  app.post('/process_email', (req, res) => {
    // parse the request for data, team, score, team
    // if parsed correctly, save result and send email back
    // otherwise send failure email
    console.log(req);
  });


  // handle the ajax POST of a result
  app.post('/matches/result', (req, res) => {
    
    if (req.user) {
      if (req.body.score.match(/[0-9]{1,2}-[0-9]{1,2}/)) {
        models.Match.update({
          score: req.body.score || null
        }, {
          where: [{ id: req.body.mid }, { season: 2016 }]
        }).then(rows => {
          res.send(rows == 1);
        }).catch(e => {
          res.send(e);
        })
      } else {
        res.send(false);
      }
      
    } else {
      res.sendStatus(403);
    }
  })

  app.get('/dodgeball/rules', (req, res) => {
    res.render('db_home', {
      title: 'Rules',
      layout: 'dodgeball'
    });
  })

}

module.exports = routes;