var express = require('express'),
    connect = require('connect'),
    path = require('path'),
    harp = require('harp'),
    crypto = require('crypto');

var md5sum = function (str) {
  return crypto.createHash('md5').update(str).digest('hex');
};

var handlersParser = require('./lib/handlersParser.js');
var frontend = require('./lib/frontendRenderer.js');

var app = express();
var handlers;

/* Add default middleware */
app.use( express.compress() );
app.use( express.json() );
app.use( express.urlencoded() );

/* the main synth init function */
exports = module.exports = function (options) {
  options = options || {};
  var resourceDir = options.resourceDir || path.join(process.cwd(), 'back/resources');
  var viewDir = options.viewDir || path.join(process.cwd(), 'front');
  var production = !!options.production || process.env['NODE_ENV'] == 'production';

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

  app.use( '/images', express.static( path.join(process.cwd(), 'front/images') ) );
  if (production) {
    process.stdout.write('Precompiling JS and CSS files... ');
    var precompiledJsHash = md5sum(frontend.jsPrecompiled() );
    var precompiledJsPath = '/js/main-' + precompiledJsHash + '.js';
    app.get(precompiledJsPath, function (req, res) {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'public, max-age=999999999');
      res.send( frontend.jsPrecompiled() );
      res.end();
    });
    exports.jsFiles.length = 0;
    exports.jsFiles.push(precompiledJsPath);

    var precompiledCssHash = md5sum( frontend.cssPrecompiled() );
    var precompiledCssPath = '/css/main-' + precompiledCssHash + '.css';
    app.get(precompiledCssPath, function (req, res) {
      res.setHeader('Content-Type', 'text/css; charset=UTF-8');
      res.setHeader('Cache-Control', 'public, max-age=999999999');
      res.send( frontend.cssPrecompiled() );
      res.end();
    });
    exports.cssFiles.length = 0;
    exports.cssFiles.push(precompiledCssPath);
    console.log('Done');
  } else {
    app.use( '/js', harp.mount( path.join(process.cwd(), 'front/js') ) );
    app.use( '/css', harp.mount( path.join(process.cwd(), 'front/css') ) );
  }
  app.use( '/html', harp.mount( path.join(process.cwd(), 'front/html') ) );
  app.use( '/bower-packages', harp.mount( path.join(process.cwd(), 'front/bower-packages') ) );

  /* Render the main index */
  app.set( "views", viewDir );
  app.set('view engine', 'jade');
  app.get('/', frontend.index);

  return app;
};

// Allow early access to the app before it parses the API and sets the routes
exports.app = app;

// Expose the command-line commands programmatically
exports.commands = require('./lib/commands.js');

// Return the raw express-style handlers
exports.apiHandlers = function () { return handlers; };

exports.jsFiles = frontend.jsFiles;

exports.cssFiles = frontend.cssFiles;

/* Expose connect middleware */
/* Code borrowed from Express */
for (var key in connect.middleware) {
  Object.defineProperty(
    exports,
    key,
    Object.getOwnPropertyDescriptor(connect.middleware, key)
  );
}
