// jshint node: true, esversion: 6
'use strict';

const config  = require('../config/mail_config'),
      mailgun = require('mailgun-js')(config);

const mail = {

  send: (recipient, subject, message, done) => {

    var data = {
      from: 'Civil Service Softball League <results@lcssl.org>',
      to: recipient,
      subject: subject,
      text: message
    };

    mailgun.messages().send(data).then(response => {
      console.log('email sent', response); // move to winston
      done(response);
    }, err => {
      console.error('not sent', err); // move to winston
      done(err);
    });

  }

};

module.exports = mail;