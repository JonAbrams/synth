var _ = require('lodash');
var Promise = require('bluebird');
var bodyParser = Promise.promisify(require('body-parser').json());

exports.params = function (req, res) {
  // Combines the three sources of parameters into one, and return them in one object
  // Similar to how Rails and various other frameworks do it
  return bodyParser(req, res).then(function () {
    return _.merge({}, req.query, req.params, req.body);
  });
};
