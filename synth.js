var express = require('express');
var connect = require('connect');
var handlersParser = require('./lib/handlersParser.js');
var app = express();
var handlers;

/* Add default middleware */
app.use( express.bodyParser() );

/* the main synth init function */
exports = module.exports = function (options) {
  options = options || {};
  var resourceDir = options.resourceDir || 'resources';

  // On startup, parse all the resource handling modules
  handlers = handlersParser.parse(resourceDir);

  /* Tell express to listen for each request handler */
  handlers.forEach(function (handler) {
    app[handler.method]( handler.path, handler.func() );
  });

  app.all('/api/*', function (req, res) {
    res.statusCode = 404;
    res.json({ error: 'Resource not found'});
  });

  return app;
};

exports.apiHandlers = function () { return handlers; };

/* Expose connect middleware */
/* Code borrowed from Express */
for (var key in connect.middleware) {
  Object.defineProperty(
    exports,
    key,
    Object.getOwnPropertyDescriptor(connect.middleware, key)
  );
}
