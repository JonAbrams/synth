var express = require('express'),
    connect = require('connect'),
    path = require('path'),
    harp = require('harp');

var handlersParser = require('./lib/handlersParser.js');
var frontend = require('./lib/frontendRenderer.js');

var app = express();
var handlers;

/* Add default middleware */
app.use( express.json() );
app.use( express.urlencoded() );

/* the main synth init function */
exports = module.exports = function (options) {
  options = options || {};
  var resourceDir = options.resourceDir || path.join(process.cwd(), 'back/resources');
  var viewDir = options.viewDir || path.join(process.cwd(), 'front');

  /* On startup, parse all the resource handling modules */
  handlers = handlersParser.parse(resourceDir);

  /* Tell express to listen for each request handler */
  handlers.forEach(function (handler) {
    app[handler.method]( handler.path, handler.func() );
  });

  /* Handle API requests */
  app.all('/api/*', function (req, res) {
    res.statusCode = 404;
    res.json({ error: 'Resource not found'});
  });

  /* Handle front-end requests for assets */
  app.use(express.static(path.join(process.cwd(), 'front/misc')));

  /* Serve up assets statically for now, later on an asset pipeline will be added */
  app.use( '/images', express.static( path.join(process.cwd(), 'front/images') ) );
  app.use( '/js', harp.mount( path.join(process.cwd(), 'front/js') ) );
  app.use( '/css', harp.mount( path.join(process.cwd(), 'front/css') ) );
  app.use( '/html', harp.mount( path.join(process.cwd(), 'front/html') ) );
  app.use( '/bower-packages', harp.mount( path.join(process.cwd(), 'front/bower-packages') ) );

  /* Render the main index */
  app.set( "views", viewDir );
  app.set('view engine', 'jade');
  app.get('/', frontend.index);

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
