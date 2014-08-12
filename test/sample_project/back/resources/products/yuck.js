var Promise = require('bluebird');

exports.getForever = function () {
  return new Promise(function () {}); // Never resolved! (I guess it's not a Lannister)
};
