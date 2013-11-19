var resourceParser = require('./lib/resourceParser.js');

module.exports = function (options) {
  options = options || {};
  var resourceDir = options.resourceDir || 'resources';

  // On startup, parse all the resource handling modules
  var resources = resourceParser.parse(__dirname + '/' + resourceDir);

  return function (req, res, next) {
    if (req.url == '/') {
      res.setHeader('Content-Type', 'text/html');
      res.write('TODO: Render template here');
      return res.end();
    }
    res.setHeader('Content-Type', 'application/json');
    reqHandler = resFinder(res.method, req.url);
    if (reqHandler) {
      return reqHandler(req, res);
    }

    res.write(404, JSON.stringify({
      error: 'Resource not found'
    }));
    res.end();
  };
};
