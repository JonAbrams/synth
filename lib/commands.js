var fs = require('fs'),
    npm = require('npm'),
    bower = require('bower'),
    gulp = require('gulp'),
    nopt = require('nopt'),
    path = require('path'),
    pkg = require('../package.json'),
    requireUncached = require('./requireUncached.js'),
    _ = require('lodash'),
    bowerSupport = require('./bowerSupport.js'),
    wrench = require('wrench'),
    Promise = require('bluebird');

// Add global support for coffee-script
require('coffee-script/register');

function loadApp () {
  var nodeProjectExists = fs.existsSync( path.join(process.cwd(), 'package.json') );
  if (!nodeProjectExists) {
    console.error('Could not find a package.json. Is this directory a Synth project?');
    process.exit(1);
  }
  var synthExists = fs.existsSync( path.join(process.cwd(), 'node_modules/synth') );
  if (!synthExists) {
    console.error('Could not find `./node_modules/synth` in this project. Is this directory a Synth project?');
    process.exit(1);
  }

  try {
    return requireUncached( path.join(process.cwd(), 'back/back-app') );
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.error('A module failed to load. Maybe you should try running `synth install -b`');
      process.exit(1);
    } else throw err;
  }
}

exports.createNewApp = function (dirName) {
  var args = nopt({ 'template': String }, { 't': '--template' });
  var template = args.template || 'blurbs-mongo-angular'

  try {
    /* Test that the specified is empty and can be written to */
    fs.mkdirSync(dirName);
    fs.rmdirSync(dirName);
  } catch (err) {
    if (err.code == 'EEXIST')
      console.log('Oops, that folder already exists. Try specifying a different name.');
    else
      console.log(err.message);
    return;
  }

  applyTemplate(template, dirName);
  console.log('Successfully created a new synth app in ' + dirName);
};

exports.printRoutes = function () {
  var app = loadApp();

  console.log([
    'API Routes:',
    '---------------'
  ].join('\n'));

  app.handlers.forEach(function (handler) {
    console.log([
      handler.method.toUpperCase(),
      handler.path,
      '.' + handler.file.replace(process.cwd(), '') + '#' + handler.funcName
    ].join(' '));
  });
};

exports.install = function (command, args) {
  var nodeModuleIndex = args.indexOf('-b') + 1;
  var bowerComponentIndex = args.indexOf('-f') + 1;
  var both = !!(nodeModuleIndex && bowerComponentIndex);

  if (nodeModuleIndex || both) {
    var nodeModules = getModules(args, nodeModuleIndex);

    npm.load({ save: true }, function (err) {
      npm.commands.install(nodeModules);
    });
  }

  if (bowerComponentIndex || both) {
    var bowerComponents = getModules(args, bowerComponentIndex);

    bower.config.cwd = process.cwd();
    var bowerInstall = bower.commands[command](bowerComponents, {
      save: true,
      forceLatest: true
    });

    bowerInstall.on('log', function(log) {
        /* Log is a custom object coming from bower, so log it out */
        console.log('Bower:', log.id, log.message);

    });

    bowerInstall.on('end', function (installed) {
      /* Add installed components to the asset manifest files */
      bowerSupport.addToManifestFiles(installed);
    });
  }
};

exports.uninstall = function (command, args) {
  var nodeModuleIndex = args.indexOf('-b') + 1;
  var bowerComponentIndex = args.indexOf('-f') + 1;
  var both = !!(nodeModuleIndex && bowerComponentIndex);

  if (nodeModuleIndex || both) {
    var nodeModules = getModules(args, nodeModuleIndex);

    npm.load({ save: true }, function (err) {
      npm.commands.uninstall(nodeModules);
    });
  }

  if (bowerComponentIndex || both) {
    var bowerComponents = getModules(args, bowerComponentIndex);

    bower.config.cwd = process.cwd();
    promises = {};
    bowerComponents.forEach(function(component, index){
      promises[component] = new Promise(function(resolve){
        bower.commands.info(component).on('end', function(info){
          return resolve({
            pkgMeta: info.latest
          });
        });
      });
    });
    bower.commands[command](bowerComponents, { save: true })
    .on('end', function (uninstalled) {
      Promise.props(promises).then(function(infos){
        /* Remove uninstalled components from the asset manifest files */
        bowerSupport.removeFromManifestFiles(infos);
      });
    });
  }
};

exports.showHelp = require('./help.js').show;

var skipFiles = /^\.DS_Store$/;

function applyTemplate (template, dest) {
  var appName = dest.replace(/.*\//g, '');
  var templatePath = path.join(__dirname, '../templates', template);

  /* Copy over all the files from the specified directory */
  try {
    wrench.copyDirSyncRecursive( templatePath, dest, { filter: skipFiles } );
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error('The template "' + template + '" could not be found.');
      process.exit(1);
    }
  }

  /* Run each file through the template renderer */
  wrench.readdirSyncRecursive(dest).forEach(function (file) {
    var filePath = path.join(dest, file);
    try { // Reads will fail on a directory, try/catch will catch it
      var contents = fs.readFileSync(filePath, { encoding: 'utf8' });
      var tokens = {
        appName: appName,
        synthVersion: pkg.version
      };

      if (file === '_dot_gitignore') {
        fs.unlinkSync(filePath); // Delete the file
        filePath = path.join(dest, '.gitignore');
      }

      fs.writeFileSync( filePath, _.template(contents, tokens) );
    } catch (err) {
      if (err.code != 'EISDIR') throw err; // If a file is a dir, that's not an error
    }
  });
}

function getModules ( args, startIndex ) {
  var modules = [];
  var module;

  for (var i = startIndex; i < args.length; i++ ) {
    module = args[i];
    if (!module || module[0] == '-') break;
    modules.push(module);
  }
  return modules;
}
