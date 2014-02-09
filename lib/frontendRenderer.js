var path = require('path'),
    _ = require('lodash'),
    fs = require('fs'),
    coffee = require('coffee-script'),
    uglify = require('uglify-js'),
    ngmin = require('ngmin'),
    sass = require('node-sass'),
    stylus = require('stylus'),
    CleanCSS = require('clean-css'),
    Promise = require('bluebird'),
    handlers = require('./handlersParser.js').apiHandlers;

var jsFilesJson = fs.readFileSync( path.join(process.cwd(), 'front/js/jsFiles.json') );
var originalJsFiles = JSON.parse(jsFilesJson);
var jsFiles = originalJsFiles.map(function (file) {
  return 'js/' + file.replace(/\.coffee$/, '.js');
});

var cssFilesJson = fs.readFileSync( path.join(process.cwd(), 'front/css/cssFiles.json') );
var originalCssFiles = JSON.parse(cssFilesJson);
var cssFiles = originalCssFiles.map(function (file) {
  return 'css/' + file.replace(/\.(sass|scss|less|styl)$/, '.css');
});

exports.jsFiles = jsFiles;
exports.cssFiles = cssFiles;

exports.index = function (req, res) {
  var handler = _( handlers() ).where({ path: '/api' + req.path }).first();
  var dataPromise = handler && handler.func(true)(req, res);

  // Cast to promise in case no handler is found or non-promise is returned
  Promise.cast(dataPromise)
  .then(function (data) {
    res.render( 'index', {
      appName: req.appName || 'Synth App',
      jsFiles: jsFiles,
      cssFiles: cssFiles,
      data: data
    });
  });
};

var jsPrecompiled;
exports.jsPrecompiled = function () {
  if (typeof jsPrecompiled == 'string') return jsPrecompiled;

  var jsRoot = path.join(process.cwd(), 'front/js');

  jsPrecompiled = "";

  // Combine all files together, compile from coffee-script when needed
  originalJsFiles.forEach(function (file) {
    var code = fs.readFileSync( path.join(jsRoot, file), { encoding: 'utf8' } );
    if ( /\.(coffee|litcoffee|coffee\.md)$/.test(file) ) {
      jsPrecompiled += coffee.compile(code);
    } else {
      jsPrecompiled += code;
    }
  });

  // If any of the code is from angularjs, make it safe for minification
  jsPrecompiled = ngmin.annotate(jsPrecompiled);

  jsPrecompiled = uglify.minify(jsPrecompiled, { fromString: true }).code;

  return jsPrecompiled;
};

var cssPrecompiled;
exports.cssPrecompiled = function () {
  if (typeof cssPrecompiled == 'string') return cssPrecompiled;

  var cssRoot = path.join(process.cwd(), 'front/css');

  cssPrecompiled = "";

  // Combine all files together, compile from sass or stylus when needed
  originalCssFiles.forEach(function (file) {
    var code = fs.readFileSync( path.join(cssRoot, file), { encoding: 'utf8' } );
    var cssPaths = [
      cssRoot,
      path.join('front/bower_components')
    ];
    if ( /\.(sass|scss)$/.test(file) ) {
      cssPrecompiled += sass.renderSync({
        data: code,
        includePaths: cssPaths
      });
    } else if ( /\.styl$/.test(file) ) {
      cssPrecompiled += stylus(code).set('paths', cssPaths).render();
    } else if ( /\.less$/.test(file) ) {
      // Tell parser where to look when using @import
      var lessParser = new(less.Parser)({ paths: cssPaths });
      // TODO: Figure out less parsing here
      // It doesn't seem to allow for synchronous parsing
    } else {
      cssPrecompiled += code;
    }
    cssPrecompiled += '\n';
  });

  cssPrecompiled = new CleanCSS().minify(cssPrecompiled);

  return cssPrecompiled;
};
