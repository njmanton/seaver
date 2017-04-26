/* jshint indent: 2 */
'use strict';

const teams = (sequelize, DataTypes) => {
  return sequelize.define('teams', {
    id: {
      type: DataTypes.INTEGER(4),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    s2011: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    s2013: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    s2014: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    s2015: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },    
    s2015: {
      type: DataTypes.INTEGER(11),
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
    tableName: 'teams',
    freezeTableName: true
  });
};

module.exports = teams;
