var _ = require('lodash');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('matches', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    season: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    round: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    teama_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    teamb_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    score: {
      type: DataTypes.STRING,
      allowNull: true
    },
    comments: {
      type: DataTypes.STRING,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    classMethods: {
      table: function(models, season) {
        return models.Match.findAll({
          where: { season: season || 2016 },
          order: ['date'],
          raw: true,
          attributes: [
            'id',
            'score',
            'teama_id',
            'teamb_id',
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
        }).then(function(matches) {
          var table = {};
          // loop through matches, creating an array of teams with results
          for (var x = 0; x < matches.length; x++) {
            
              var ta = matches[x]['TeamA.name'];
              var tb = matches[x]['TeamB.name'];

              if (!(ta in table)) {
                table[ta] = {
                  name: ta,
                  id: matches[x]['teama_id'],
                  logo: ta.replace(/\s|\'/g, '').toLowerCase() + '.png',
                  pl: 0,
                  points: 0,
                  w: 0,
                  d: 0,
                  l: 0,
                  rf: 0,
                  ra: 0,
                  last5: []
                }
              }
              if (!(tb in table)) {
                table[tb] = {
                  name: tb,
                  id: matches[x]['teamb_id'],
                  logo: tb.replace(/\s|\'/g, '').toLowerCase() + '.png',
                  pl: 0,
                  points: 0,
                  w: 0,
                  d: 0,
                  l: 0,
                  rf: 0,
                  ra: 0,
                  last5: []
                }
              }
            if (matches[x].score != null) {
              var scores = matches[x].score.split('-').map(function(e) { return e * 1; });

              if (scores[0] > scores[1]) { // 'home' win
                table[ta].w++;
                table[tb].l++;
                table[ta].points += 3;
                table[ta].last5.push({ oppo: table[tb].name, outcome: 'W', score: matches[x].score });
                table[tb].last5.push({ oppo: table[ta].name, outcome: 'L', score: matches[x].score.split('-').reverse().join('-') });
              } else if (scores[0] < scores[1]) { // 'away' win
                table[ta].l++;
                table[tb].w++;
                table[tb].points += 3;
                table[ta].last5.push({ oppo: table[tb].name, outcome: 'L', score: matches[x].score });
                table[tb].last5.push({ oppo: table[ta].name, outcome: 'W', score: matches[x].score.split('-').reverse().join('-') });
              } else if (scores[0] == scores[1]) { // draw
                table[ta].d++;
                table[tb].d++;
                table[ta].points++;
                table[tb].points++;
                table[ta].last5.push({ oppo: table[tb].name, outcome: 'D', score: matches[x].score });
                table[tb].last5.push({ oppo: table[ta].name, outcome: 'D', score: matches[x].score });
              }

              table[ta].rf += scores[0];
              table[ta].ra += scores[1];
              table[tb].rf += scores[1];
              table[tb].ra += scores[0];
              table[ta].pl++;
              table[tb].pl++;

            }
          }

          // sort the table
          var league = [];
          for (var prop in table) {
            league.push(table[prop]);
          }
          // add runs difference to array
          // and keep only last five results, ordered by date desc
          league.map(function(t) { 
            t.rd = t.rf - t.ra;
            t.last5 = t.last5.reverse().slice(0, 5);
          });
          return _.orderBy(league, ['points', 'rd', 'rf'], ['desc', 'desc', 'desc']);

        });
      },
      
      fixtures: function(models, round, season) {
        var options = {
          where: [{ season: season || 2016 }],
          raw: true,
          attributes: [
            'id',
            'score',
            'teama_id',
            'teamb_id',
            'round',
            [models.sequelize.fn('date_format', models.sequelize.col('date'), '%D %b'), 'date'],
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
        }
        if (round) {
          options.where.push({ round: round });
        }
        return models.Match.findAll(options).then(function(data) {

          var table = {}, match, weeks = [];
          for (var x = 0; x < data.length; x++) {
            match = data[x];
            if (!(match.round in table)) {
              table[match.round] = {
                round: match.round,
                date: match.date,
                fixtures: []
              }
            }
            table[match.round].fixtures.push({
              id: match.id,
              score: match.score || '-',
              teama: {
                id: match.teama_id,
                name: match['TeamA.name']
              },
              teamb: {
                id: match.teamb_id,
                name: match['TeamB.name'] 
              }
            })
          }
          
          for (var prop in table) {
            weeks.push(table[prop]);
          }
          return weeks;
        })
      }
    }
  }, {
    tableName: 'matches',
    freezeTableName: true
  });
};
