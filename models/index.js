'use strict';

var Sequelize = require('sequelize'),
    conn      = require('../config/db_config'),
    sequelize = new Sequelize(conn.test, { logging: false }),
    db        = {};

db['Team']  = sequelize.import('./teams.js');
db['User']  = sequelize.import('./users.js');
db['Match'] = sequelize.import('./matches.js');

// associations

// team[a] 1:n match
// team[b] 1:n match 
db['Team'].hasMany(db['Match']);
db['Match'].belongsTo(db['Team'], { as: 'TeamA', foreignKey: 'teama_id' });
db['Match'].belongsTo(db['Team'], { as: 'TeamB', foreignKey: 'teamb_id' });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;