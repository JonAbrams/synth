var fs = require('fs'),
    npm = require('npm'),
    bower = require('bower'),
    path = require('path'),
    pkg = require('../package.json'),
    _ = require('lodash'),
    bowerSupport = require('./bowerSupport.js'),
    wrench = require('wrench');

exports.createNewApp = function (dirName) {
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

  applyTemplate('root', 'main', dirName);
  applyTemplate('back', 'main', dirName);
  applyTemplate('front', 'main', dirName);
  console.log('Successfully created a new synth app in ' + dirName);
};

exports.startServer = function (mode) {
  var port = process.env['PORT'] || 3000;
  var app = require( path.join(process.cwd(), 'back/back-app.js') );
  if (app && typeof app.listen == 'function') {
    app.listen(port);
    console.log('synth is now listening on port ' + port);
  } else {
    console.log('No synth app detected.');
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
  wrench.copyDirSyncRecursive( templatePath, destPath );

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
