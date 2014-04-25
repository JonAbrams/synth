var express = require('express'),
    _ = require('lodash'),
    path = require('path'),
    os = require('os'),
    fs = require('fs'),
    harp = require('harp'),
    crypto = require('crypto'),
    mkdirp = require('mkdirp'),
    connect = require('connect'),
    st = require('st');

var md5sum = function (str) {
  return crypto.createHash('md5').update(str).digest('hex');
};

var handlersParser = require('./lib/handlersParser.js');
var frontend = require('./lib/frontendRenderer.js');
var assets = require('./lib/assets.js');

var app = express();
var handlers;

/* Add default middleware */
app.use( connect.compress() );
app.use( connect.json() );
app.use( connect.urlencoded() );

/* the main synth init function */
exports = module.exports = function (options) {
  options = options || {};
  var resourceDir = options.resourceDir || path.join(process.cwd(), 'back/resources');
  var viewDir = options.viewDir || path.join(process.cwd(), 'front');
  var production = !!options.production || process.env.NODE_ENV === 'production';

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
  assets.init();
  app.use(
    st({
      url: '/',
      path: path.join(process.cwd(), 'front/misc'),
      passthrough: true,
      index: false
    })
  );

  app.use(
    st({
      url: '/images',
      path: path.join(process.cwd(), 'front/images'),
      passthrough: true,
      index: false
    })
  );
  if (production) {
    var assetsDir = path.join(os.tmpdir(), 'synth-assets');
    mkdirp.sync(assetsDir);
    process.stdout.write('Precompiling JS and CSS files... ');

    /* Generate JS file */
    var jsHash = md5sum( assets.jsPrecompiled() );
    var jsFilename = 'main-' + jsHash + '.js';
    var localJsPath = path.join(assetsDir, jsFilename);
    fs.writeFileSync(
      localJsPath,
      assets.jsPrecompiled()
    );
    var jsPath = '/js/' + jsFilename;
    exports.jsFiles.length = 0;
    exports.jsFiles.push(jsPath);

    /* Generate CSS file */
    var cssHash = md5sum( assets.cssPrecompiled() );
    var cssFilename = 'main-' + cssHash + '.css';
    var localCssPath = path.join(assetsDir, cssFilename);
    fs.writeFileSync(
      localCssPath,
      assets.cssPrecompiled()
    );
    var cssPath = '/css/' + cssFilename;
    exports.cssFiles.length = 0;
    exports.cssFiles.push(cssPath);

    /* Make the files available */
    app.use(st({ path: assetsDir, url: '/js', index: false }));
    app.use(st({ path: assetsDir, url: '/css', index: false }));
    console.log('Done');
  } else {
    app.use( '/js', harp.mount( path.join(process.cwd(), 'front/js') ) );
    app.use( '/css', harp.mount( path.join(process.cwd(), 'front/css') ) );
  }
  app.use( '/html', harp.mount( path.join(process.cwd(), 'front/html') ) );
  app.use( '/bower_components', harp.mount( path.join(process.cwd(), 'front/bower_components') ) );

  /* Render the main index */
  app.set( "views", viewDir );
  app.set('view engine', 'jade');
  if (!production) app.locals.pretty = true;
  app.get('/', frontend.index);

  /* Provide routes to render the index with preloaded data */
  _(handlers).where({ method: 'get' }).forEach(function (handler) {
    var path = handler.path.replace(/^\/api/, '');
    app.get(path, function (req, res, next) {
      req.handler = handler;
      frontend.index(req, res, next);
    });
  });

  return app;
};

// Allow early access to the app before it parses the API and sets the routes
exports.app = app;

// Expose the command-line commands programmatically
exports.commands = require('./lib/commands.js');

// Return the raw express-style handlers
exports.apiHandlers = handlersParser.apiHandlers;

exports.jsFiles = assets.jsFiles;

exports.cssFiles = assets.cssFiles;
