'use strict';

var models        = require('../models'),
    bCrypt        = require('bcrypt-nodejs'),
    passport      = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

module.exports = function(app) {

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use('local', new LocalStrategy(
    function(username, password, done) {
      models.User.findOne({
        where: { username: username },
        raw: true
      }).then(function(user) {
        if (!user) {
          console.log('user not found');
          return done(null, false, { message: 'User not found' });
        }
        if (!bCrypt.compareSync(password, user.password)) {
          console.log('wrong password');
          return done(null, false, { message: 'Incorect password' })
        }
        return done(null, user);

      }).catch(function(err) {
        return done(err);
      })
    }
  ));

  app.use(function (req, res, next) {
    if (!res.locals.user && req.user) {
      res.locals.user = req.user;
    }
    next();
  });

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    models.User.findById(id).then(function(user) {
      done(null, user);
    });
  });

}