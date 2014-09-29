/* Connect to Mongo DB */
var db = require('promised-mongo')(process.env.MONGODB || 'tweets-db');

exports.db = function () {
  return db;
};
