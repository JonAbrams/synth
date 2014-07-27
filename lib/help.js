var pkg = require('../package.json');

exports.show = function (command) {
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
        '  -p, --port  Specify the port that the server should listen on. By default the port is 3000.',
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
    case 'routes':
      helpMsg.push(
        'Usage: synth routes',
        '',
        'Description:',
        '  The `synth routes` command displays the HTTP paths and method that',
        '  the current Synth app listens for.',
        '',
        'Example:',
        '  synth routes'
      );
      break;
    default:
      helpMsg.push(
        'Usage: synth COMMAND [args]',
        '',
        'Commands:',
        ' new      Create a new synth app in the specified directory. e.g. `synth new my_app`',
        ' server   Start a local dev server. Must be executed from the app\'s root folder.',
        ' prod     Start a local production server. Will precomiple front-end assets before serving.',
        ' install  Install third-party packages (back-end or front-end) for use by your web app',
        ' routes   Shows the various HTTP paths that the current Synth project listens to.',
        ' help     Shows you this text, or if you pass in another command, it tells you',
        '          more about it. e.g. `synth help new`'
      );
  }

  console.log( helpMsg.join('\n') );
};
