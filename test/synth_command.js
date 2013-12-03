require('should');
var mkdirp = require('mkdirp'),
  path = require('path'),
  exec = require('child_process').exec,
  spawn = require('child_process').spawn,
  os = require('os'),
  fs = require('fs'),
  _ = require('lodash'),
  pkg = require('../package.json'),
  request = require('supertest'),
  temp = require('temp'),     // Creates temporary directories
  wrench = require('wrench'); // Recursive file operations

/* Make a place on the filesystem for our tests */
temp.track();

describe("synth command-line", function () {
  beforeEach(function () {
    var rootDir = temp.mkdirSync('synth-tests');
    process.chdir(rootDir);
  });

  function synthCmd (args) {
    args = args || '';
    return path.join(__dirname, '../bin/synth ') + args;
  }

  describe('help text', function () {
    describe('unrecognized command', function () {
      it('says the command is unrecognized', function (done) {
        exec(synthCmd('huh'), function (err, stdout) {
          stdout.should.contain('Unrecognized command: huh');
          done();
        });
      });
    });

    describe('basic help', function () {
      it('shows the right text', function (done) {
        exec(synthCmd(), function (err, stdout) {
          stdout.should.eql([
            'synth version ' + pkg.version,
            '',
            'Usage: synth COMMAND [args]',
            '',
            'Commands:',
            ' new      Create a new synth app in the specified directory. e.g. `synth new my_app`',
            ' dev      Start a local development server. Must be executed from the root folder',
            '          of a synth app',
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
            'synth version ' + pkg.version,
            '',
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

      it('show dev mode help text', function (done) {
        exec(synthCmd('help dev'), function (err, stdout) {
          stdout.should.eql([
            'synth version ' + pkg.version,
            '',
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
            '  -p, --port    Specify the port that the server should listen on. By default the port is 3000.',
            ''
          ].join('\n'));
          done();
        });
      });
    });
  });

  describe('project generation', function () {
    var appName = 'test_app-' + _.random(10000);
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

    it('renders templates', function (done) {
      exec(newAppCmd, function (err, stdout) {
        fs.readFileSync( path.join(appName, 'synth.json'), { encoding: 'utf8' } ).should.contain('"name": "' + appName + '"');
        done();
      });
    });
  });

  describe('Launching dev server', function () {
    var spawnDevServer = function () {
      return spawn('synth', ['dev'], {
          cwd: process.cwd(),
          env: {
            'PATH': path.join(__dirname, '../bin') + ':' + process.env['PATH']
          }
        });
    };

    beforeEach(function (done) {
      var appName = 'test_app-' + _.random(10000);
      var nodeModulesPath = path.join(__dirname, '../node_modules');
      var synthPath = path.join(__dirname, '..');
      exec(synthCmd('new ' + appName), function (err, stdout) {
        process.chdir(appName);
        // To start the server, it needs some modules, just use this package's
        fs.symlinkSync(nodeModulesPath, 'node_modules', 'dir');
        try {
          // Add a symlink to this particular module if necessary
          fs.symlinkSync(synthPath, path.join('node_modules/synth'), 'dir');
        } catch (error) {
          if (error.code != 'EEXIST') throw error;
        }
        done();
      });
    });

    it('says the it launched the server', function (done) {
      var dev = spawnDevServer();
      dev.stdout.on('data', function (data) {
        data.toString().should.eql('Starting synth server on port 3000\n');
        dev.kill();
        done();
      });
    });

    it.only('listens on port 3000', function (done) {
      var dev = spawnDevServer();
      dev.stdout.on('data', function (data) {
        request('http://localhost:3000').get('/api/some_endpoint')
        .expect(404)
        .expect({ error: 'Resource not found'})
        .end(function (err) {
          dev.kill();
          if (err) throw err;
          done();
        });
      });
    });
  });
});
