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
        ' routes   Shows the various HTTP paths that the current Synth project listens to.',
        ' help     Shows you this text, or if you pass in another command, it tells you',
        '          more about it. e.g. `synth help new`'
      );
  }

  console.log( helpMsg.join('\n') );
};
