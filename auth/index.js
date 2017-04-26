'use strict';

var models        = require('../models'),
    bCrypt        = require('bcrypt-nodejs'),
    passport      = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

let auth = app => {

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use('local', new LocalStrategy((username, password, done) => {
    models.User.findOne({
      where: { username: username },
      raw: true
    }).then(user => {
      if (!user) {
        console.log('user not found');
        return done(null, false, { message: 'User not found' });
      }
      if (!bCrypt.compareSync(password, user.password)) {
        console.log('wrong password');
        return done(null, false, { message: 'Incorect password' })
      }
      return done(null, user);

    }).catch(err => {
      return done(err);
    })
  }));

  app.use((req, res, next) => {
    if (!res.locals.user && req.user) {
      res.locals.user = req.user;
    }
    next();
  });

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    models.User.findById(id).then(user => {
      done(null, user);
    });
  });

}

module.exports = auth;
