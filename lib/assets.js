var fs = require('fs'),
    path = require('path'),
    coffee = require('coffee-script'),
    uglify = require('uglify-js'),
    ngannotate = require('ng-annotate'),
    sass = require('node-sass'),
    stylus = require('stylus'),
    CleanCSS = require('clean-css');

var validFile = function (str, type) {
  // Skip file if line is empty or starts with #
  if ( !str || /\s*#/.test(str) ) return false;
  return fs.existsSync( path.join(cwd, 'front', type, str) );
};

var cwd;
var originalJsFiles = [];
var originalCssFiles = [];

/* Initialize either 'js' assets or 'css' assets */
var initialized = {};
var init = function (type) {
  var filesRaw;
  var relPath = path.join(cwd, 'front', type, type + 'Files');

  if (initialized[type]) return;
  initialized[type] = true;

  try {
    filesRaw = fs.readFileSync(relPath).toString();
  } catch (err) {
    console.error('Could not read ' + type + ' manifest files.');
    console.error('Make sure one exists at front/' + type + '/' + type + 'Files');
    return;
  }

  var originalFiles = filesRaw.split('\n').filter(function (file) {
    return validFile(file, type);
  });

  if (type === 'js') {
    originalJsFiles = originalFiles;
    originalJsFiles.forEach(function (file) {
      exports.jsFiles.push( '/js/' + file.replace(/\.coffee$/, '.js') );
    });
  } else if (type === 'css') {
    originalCssFiles = originalFiles;
    originalCssFiles.forEach(function (file) {
      var newFile = '/css/' + file.replace(/\.(sass|scss|styl)$/, '.css');
      exports.cssFiles.push(newFile);
    });
  }
};

exports.jsFiles = [];
exports.cssFiles = [];

exports.init = function (newCwd) {
  cwd = newCwd || process.cwd();
  init('js');
  init('css');
};

var jsPrecompiled;
exports.jsPrecompiled = function () {
  if (typeof jsPrecompiled == 'string') return jsPrecompiled;

  var jsRoot = path.join(cwd, 'front/js');

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
  jsPrecompiled = ngannotate(jsPrecompiled, {add: true}).src;

  jsPrecompiled = uglify.minify(jsPrecompiled, { fromString: true }).code;

  return jsPrecompiled;
};

var cssPrecompiled;
exports.cssPrecompiled = function () {
  if (typeof cssPrecompiled == 'string') return cssPrecompiled;

  var cssRoot = path.join(cwd, 'front/css');

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

exports.updateManifest = function (type, newFiles, isRemove) {
  var relPath = path.join(process.cwd(), 'front', type, type + 'Files');

  assetFiles = fs.readFileSync(relPath, { encoding: 'utf8' }).split('\n');

  assetFiles = assetFiles.filter(function (assetFile) {
    /* Remove any newly added files from the existing list */
    return newFiles.indexOf(assetFile) === -1;
  });

  if (!isRemove){
    /* Add the new files to the top of the manifest */
    assetFiles = newFiles.concat(assetFiles);
  }

  fs.writeFileSync( relPath, assetFiles.join('\n') );
};
