// jshint node: true, esversion: 6
'use strict';

const mailgun = require('mailgun-js')({ apiKey: process.env.MAILGUN_KEY, domain: 'lcssl.org' });

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