var fs = require('fs'),
    npm = require('npm'),
    bower = require('bower'),
    gulp = require('gulp'),
    nopt = require('nopt'),
    path = require('path'),
    pkg = require('../package.json'),
    _ = require('lodash'),
    bowerSupport = require('./bowerSupport.js'),
    wrench = require('wrench');

exports.createNewApp = function (dirName) {
  var args = nopt({
    'front': String,
    'back': String,
    'root': String
  }, {
    'f': '--front',
    'b': '--back',
    'r': '--root'
  });
  var options = {
    rootTemplate: args.root || 'default',
    backTemplate: args.back || 'mongojs',
    frontTemplate: args.front || 'angular'
  };

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

  applyTemplate('root', options.rootTemplate, dirName);
  applyTemplate('back', options.backTemplate, dirName);
  applyTemplate('front', options.frontTemplate, dirName);
  console.log('Successfully created a new synth app in ' + dirName);
};

function requireUncached(modulePath){
  /* Recursively delete from the require-cache
     the specified module and all of its children */
  (function deleteCached (modulePath) {
    var module = require.cache[modulePath];
    if (!module) return;
    module.children.forEach(function (module) {
      deleteCached(module.id);
    });
    delete require.cache[modulePath];
  })(require.resolve(modulePath));

  return require(modulePath);
}

exports.startServer = function (mode) {
  var port = process.env['PORT'] || 3000;
  var server;
  var restarted = false;
  var connections = [];
  var restartServer = function () {
    server.close(function () {
      startServer();
    });
    connections.forEach(function (connection) {
      connection.end();
    });
  };
  var startServer = function (restarted) {
    var app = requireUncached(path.join(process.cwd(), 'back/back-app.js'));
    if (app && typeof app.listen == 'function') {
      server = app.listen(port, function () {
        console.log('synth (in ' + mode + ' mode) is now listening on port ' + port);
      });
      server.on('connection', function (connection) {
        connections.push(connection);
        connection.on('close', function () {
          _.pull(connections, connection);
        });
      });
    } else {
      console.log('No synth app detected.');
    }
  };

  if (mode == 'production') {
    startServer();
  } else {
    gulp.watch(['back/**/*.js', '!back/node_modules/**'], function (file) {
      console.log('A file was ' + file.type + ', restarting server');
      restartServer();
    });
    startServer();
  }
};

exports.install = function (command, args) {
  var nodeModuleIndex = args.indexOf('-b') + 1;
  var bowerComponentIndex = args.indexOf('-f') + 1;
  var both = !!(nodeModuleIndex && bowerComponentIndex);

  var getModules = function (startIndex) {
    var modules = [];
    var module;

    for (var i = startIndex; i < args.length; i++ ) {
      module = args[i];
      if (!module || module[0] == '-') break;
      modules.push(module);
    }
    return modules;
  };


  if (nodeModuleIndex || both) {
    var nodeModules = getModules(nodeModuleIndex);

    process.chdir('back');
    npm.load({ save: true }, function (err) {
      npm.commands.install(nodeModules);
    });
  }

  if (bowerComponentIndex || both) {
    var bowerComponents = getModules(bowerComponentIndex);

    process.chdir('front');
    bower.config.cwd = process.cwd();
    bower.commands[command](bowerComponents, { save: true })
    .on('end', function (installed) {
      /* Add installed components to the asset manifest files */
      bowerSupport.addToManifestFiles(installed);
    });
  }
};

exports.showHelp = require('./help.js').show;

function applyTemplate ( direction, template, dest ) {
  var destDirection =  (direction == 'root') ? '' : direction;
  var appName = dest.replace(/.*\//g, '');
  var templatePath = path.join(__dirname, '../templates', direction, template);
  var destPath = path.join(dest, destDirection);

  /* Copy over all the files from the specified directory */
  try {
    wrench.copyDirSyncRecursive( templatePath, destPath );
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error('The template "' + template + '" could not be found.');
      process.exit(1);
    }
  }

  /* Run each file through the template renderer */
  wrench.readdirSyncRecursive(destPath).forEach(function (file) {
    var filePath = path.join(destPath, file);
    try { // Reads will fail on a directory, try/catch will catch it
      var contents = fs.readFileSync(filePath, { encoding: 'utf8' });
      var tokens = {
        appName: appName,
        synthVersion: pkg.version
      };
      fs.writeFileSync( filePath, _.template(contents, tokens) );
    } catch (err) {
      if (err.code != 'EISDIR') throw err;
    }
  });
}
