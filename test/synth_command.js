require('should');
var mkdirp = require('mkdirp'),
  path = require('path'),
  exec = require('child_process').exec,
  os = require('os'),
  fs = require('fs'),
  _ = require('lodash'),
  temp = require('temp'),
  wrench = require('wrench');

/* Make a place on the filesystem for our tests */
temp.track();

describe("synth command-line", function () {
  beforeEach(function () {
    var rootDir = temp.mkdirSync('synth-tests');
    process.chdir(rootDir);
  });

  function synthCmd (args) {
    return path.join(__dirname, '../bin/synth ') + args;
  }

  describe('help text', function () {
    describe('basic help', function () {
      it('shows the right text', function (done) {
        exec(synthCmd(), function (err, stdout) {
          stdout.should.eql([
            'Usage: synth COMMAND [args]',
            '',
            'Commands:',
            ' new      Create a new synth app in the specified directory',
            ' help     Shows you this text, or if you pass in another command, it tells you',
            '          more about it. e.g. `synth help new`',
            ''
          ].join('\n'));
          done();
        });
      });

      it('shows new help text', function (done) {
        exec(synthCmd('help new'), function (err, stdout) {
          stdout.should.eql([
            'Usage: synth new APP_NAME',
            '',
            'Description:',
            '  The `synth new` command creates a new directory with the path specified by APP_NAME.',
            '  This new directory will contain a new synth project, allowing you to get up and running',
            '  with an API-first web-app in no time.',
            '',
            '  In the future, this command will take options allowing you to specify a project as',
            '  CoffeeScript, or to specify a particular front-end framework, like Angularjs or Ember',
            ''
          ].join('\n'));
          done();
        });
      });
    });
  });

  describe('project generation', function () {
    var appName = 'test_app';
    var newAppCmd = synthCmd('new ' + appName);

    it('creates a directory', function (done) {
      exec(newAppCmd, function (err, stdout) {
        fs.readdirSync('.').should.contain(appName);
        done();
      });
    });

    it('shows the right messages in the console', function (done) {
      exec(newAppCmd, function (err, stdout) {
        stdout.should.eql('Successfully created a new synth app in ' + appName + '\n');
        exec(newAppCmd, function (err, stdout) {
          stdout.should.eql('Oops, that folder already exists. Try specifying a different name.\n');
          done();
        });
      });
    });

    it('populates the project with key files', function (done) {
      exec(newAppCmd, function (err, stdout) {
        wrench.readdirSyncRecursive(appName).sort().should.eql([
          '.gitignore',
          'back',
          'back/back-app.js',
          'back/package.json',
          'back/resources',
          'back/resources/blurbs',
          'back/resources/blurbs/comments',
          'back/resources/blurbs/comments/comment.js',
          'back/resources/blurbs/createBlurb.js',
          'back/resources/blurbs/getBlurbList.js',
          'synth.json'
        ]);
        done();
      });
    });
  });
});
