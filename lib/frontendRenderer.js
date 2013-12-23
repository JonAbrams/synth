var path = require('path');

exports.js = function (req, res) {
  var file = req.url.replace(/^\/js\//, '');
};

exports.css = function (req, res) {
  var file = req.url.replace(/^\/css\//, '');
};

exports.html = function (req, res) {
  var file = req.url.replace(/^\/css\//, '');
};

exports.index = function (req, res) {
  res.render( 'index', {
    appName: '${ appName }'
  });
};
