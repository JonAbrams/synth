var synthApi = require('synth-api'),
    http = require('http'),
    express = require('express'),
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

var frontend = require('./lib/frontendRenderer.js');

var app = express();

var defaultCatchAll = function (req, res) {
  res.status(404).send({ error: 'Resource not found'});
};

/* the main synth init function */
exports = module.exports = function (options) {
  options = options || {};
  var defaultResourceDir = path.join(process.cwd(), 'back/resources');
  var defaultServiceDir = path.join(process.cwd(), 'back/services');
  var viewDir = options.viewDir || path.join(process.cwd(), 'front');
  var viewEngine = options.viewEngine || 'jade';
  if (!!options.production) process.env.NODE_ENV = 'production';
  var production = process.env.NODE_ENV === 'production';

  exports.beforeInit.forEach(function (callback) {
    callback();
  });

  /* On startup, parse all the resource handling modules */
  var handlers = synthApi.generateHandlers({
    resourceDir: options.resourceDir || defaultResourceDir,
    serviceDir: options.serviceDir || defaultServiceDir,
    app: options.app || app,
    timeout: options.apiTimeout || 5000,
    catchAll: options.catchAll || defaultCatchAll
  }).handlers;

  /* Create http server */
  app.server = http.createServer(app);

  /* Make files in the dist folder available from the root path */
  app.use(
    st({
      path: path.join(process.cwd(), 'front/dist'),
      passthrough: true,
      cache: production,
      index: false
    })
  );

  /* Render the main index */
  app.set('views', viewDir );
  app.set('view engine', viewEngine);
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

  app.handlers = handlers;

  return app;
};

exports.beforeInit = [
  function defaultSynthMiddleware () {
    var packageJson = require( path.join(process.cwd(), 'package.json') );
    app.use( connect.compress() );
    app.use(function (req, res, next) {
      req.appName = packageJson.name;
      req.appVersion = packageJson.version;
      next();
    });
  }
];

// Allow early access to the app before it parses the API and sets the routes
exports.app = app;

// Expose the command-line commands programmatically
exports.commands = require('./lib/commands.js');
