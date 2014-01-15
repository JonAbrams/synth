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

exports.showHelp = function (command) {
  var helpMsg = ['synth version ' + pkg.version, ''];

  switch (command) {
    case 'new':
      helpMsg.push(
        'Usage: synth new APP_NAME',
        '',
        'Description:',
        '  The `synth new` command creates a new directory with the path specified by APP_NAME.',
        '  This new directory will contain a new synth project, allowing you to get up and running',
        '  with an API-first web-app in no time.',
        '',
        '  In the future, this command will take options allowing you to specify a project as',
        '  CoffeeScript, or to specify a particular front-end framework, like Angularjs or Ember'
      );
      break;
    case 'server':
      helpMsg.push(
        'Usage: synth server [options]',
        '',
        'Description:',
        '  The `synth server` command launches a local web server on the specified port.',
        '  By default the web server will run in \'development mode\', which means:',
        '    - Assets to be compiled on demand.',
        '    - Assets to be served as separate and unminified files.',
        '',
        'Options:',
        '  -p     Specify the port that the server should listen on. By default the port is 3000.',
        '  --prod Run the server in production mode.',
        '',
        'Alias: synth i [options]'
      );
      break;
    case 'install':
      helpMsg.push(
        'Usage: synth install <target> [packages]',
        '',
        'Description:',
        '  The `synth install` command installs third-party packages for use by either the',
        '  back-end or the front-end. Back-end packages are provided by NPM,',
        '  front-end packages are provided by Bower.',
        '',
        '  To use this command, you must specify a target (-f or -b) followed by',
        '  a space separated list of packages you would like to install.',
        '',
        'Targets:',
        '  -f    Install packages using Bower for use by the front-end.',
        '  -b    Install packages using NPM for use by the back-end.',
        '',
        'Example (Install jquery and angular for use by the front-end):',
        '  synth install -f jquery angular',
        '',
        'Example (Install lodash for use by the back-end):',
        '  synth install -b lodash'
      );
      break;
    default:
      helpMsg.push(
        'Usage: synth COMMAND [args]',
        '',
        'Commands:',
        ' new      Create a new synth app in the specified directory. e.g. `synth new my_app`',
        ' server   Start a local server. Must be executed from the app\'s root folder.',
        ' install  Install third-party packages (back-end or front-end) for use by your web app',
        ' help     Shows you this text, or if you pass in another command, it tells you',
        '          more about it. e.g. `synth help new`'
      );
  }

  console.log( helpMsg.join('\n') );
};

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
