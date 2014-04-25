var synth = require('synth');

/* Connect to Mongo DB */
var db = require('promised-mongo')(process.env.MONGODB || 'tweets-db');

/* Provide DB connection to request handlers */
synth.app.use(function (req, res, next) {
  req.db = db;
  next();
});

/* Init and return synth app */
module.exports = synth();
