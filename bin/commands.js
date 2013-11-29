var fs = require('fs');

exports.createNewApp = function (dirName) {
  try {
    fs.mkdirSync(dirName);
    console.log('Successfully created a new synth app in ' + dirName);
  } catch (err) {
    if (err.code == 'EEXIST')
      console.log('Oops, that folder already exists. Try specifying a different name.');
    else
      console.log(err.message);
  }
};

exports.showHelp = function (command) {
  var textArr;

  switch (command) {
    case 'new':
      textArr = [
        'Usage: synth new APP_NAME',
        '',
        'Description:',
        '  The `synth new` command creates a new directory with the path specified by APP_NAME.',
        '  This new directory will contain a new synth project, allowing you to get up and running',
        '  with an API-first web-app in no time.',
        '',
        '  In the future, this command will take options allowing you to specify a project as',
        '  CoffeeScript, or to specify a particular front-end framework, like Angularjs or Ember'
      ];
      break;
    default:
      textArr = [
        'Usage: synth COMMAND [args]',
        '',
        'Commands:',
        ' new      Create a new synth app in the specified directory',
        ' help     Shows you this text, or if you pass in a command, it tells you',
        '          more about it. e.g. `synth help new`'
      ];
  }

  console.log( textArr.join('\n') );
};
