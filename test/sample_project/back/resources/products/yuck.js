var Promise = require('bluebird');

exports.getForever = function (req, res) {
  return new Promise(function () {}); // Never resolved! (I guess it's not a Lannister)
};
