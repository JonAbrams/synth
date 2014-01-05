var fs = require('fs'),
    npm = require('npm'),
    bower = require('bower'),
    path = require('path'),
    pkg = require('../package.json'),
    _ = require('lodash'),
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

  if (nodeModuleIndex || both) {
    var nodeModule = args[nodeModuleIndex] || '';

    process.chdir('back');
    npm.load({ save: true }, function (err) {
      npm.commands.install([nodeModule]);
    });
  }

  if (bowerComponentIndex || both) {
    var bowerComponent = args[bowerComponentIndex] || '';

    process.chdir('front');
    bower.commands[command]([bowerComponent], { save: true }).on('end', function (res) {
      console.log(res);
    });
  }
};

exports.showHelp = function (command) {
  var textArr = ['synth version ' + pkg.version, ''];

  switch (command) {
    case 'new':
      textArr.push(
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
    case 'dev':
      textArr.push(
        'Usage: synth dev [options]',
        '',
        'Description:',
        '  The `synth dev` command launches a local web server on the specified port.',
        "  The web server will run in 'dev mode', which causes:",
        '    - Assets to be compiled on demand.',
        '    - Assets to be served as separate and unminified files.',
        '    - The server will automatically restart if any source files are changed.',
        '',
        'Options:',
        '  -p, --port    Specify the port that the server should listen on. By default the port is 3000.'
      );
      break;
    default:
      textArr.push(
        'Usage: synth COMMAND [args]',
        '',
        'Commands:',
        ' new      Create a new synth app in the specified directory. e.g. `synth new my_app`',
        ' dev      Start a local development server. Must be executed from the root folder',
        '          of a synth app',
        ' help     Shows you this text, or if you pass in another command, it tells you',
        '          more about it. e.g. `synth help new`'
      );
  }

  console.log( textArr.join('\n') );
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
