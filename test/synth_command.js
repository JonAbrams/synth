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

function throwif(err) {
  if (err) throw err;
}

/* Set the temp directories to self-delete on exit */
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

  var appName = 'test_app-' + _.random(10000);
  var newAppCmd = synthCmd('new ' + appName);

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

      it('show server mode help text', function (done) {
        exec(synthCmd('help server'), function (err, stdout) {
          stdout.should.eql([
            'synth version ' + pkg.version,
            '',
            'Usage: synth server [options]',
            '',
            'Description:',
            '  The `synth server` command launches a local web server on the specified port.',
            "  The web server will run in 'server mode', which means:",
            '    - Assets to be compiled on demand.',
            '    - Assets to be served as separate and unminified files.',
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
    it('creates a directory', function (done) {
      exec(newAppCmd, function (err, stdout) {
        if (err) throw err;
        fs.readdirSync('.').should.contain(appName);
        done();
      });
    });

    it('shows the right messages in the console', function (done) {
      this.timeout(3000);
      exec(newAppCmd, function (err, stdout) {
        throwif(err);
        stdout.should.eql('Successfully created a new synth app in ' + appName + '\n');
        exec(newAppCmd, function (err, stdout) {
          throwif(err);
          stdout.should.eql('Oops, that folder already exists. Try specifying a different name.\n');
          done();
        });
      });
    });

    it('populates the project with key files', function (done) {
      exec(newAppCmd, function (err, stdout) {
        throwif(err);
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
          'front',
          'front/.bowerrc',
          'front/bower.json',
          'front/css',
          'front/css/cssFiles.json',
          'front/index.jade',
          'front/js',
          'front/js/jsFiles.json',
          'front/misc',
          'front/misc/robots.txt',
          'synth.json'
        ]);
        done();
      });
    });

    it('renders templates', function (done) {
      exec(newAppCmd, function (err, stdout) {
        throwif(err);
        fs.readFileSync( path.join(appName, 'synth.json'), { encoding: 'utf8' } ).should.contain('"name": "' + appName + '"');
        done();
      });
    });
  });

  describe('launching dev server', function () {
    var spawnDevServer = function () {
      return spawn('synth', ['server'], {
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
          // EEXIST can be expected if this test has been run before
          if (error.code != 'EEXIST') throw error;
        }
        done();
      });
    });

    it('says that it launched the server', function (done) {
      this.timeout(3000);
      var dev = spawnDevServer();
      dev.stdout.on('data', function (data) {
        data.toString().should.eql('synth is now listening on port 3000\n');
        dev.kill();
        done();
      });
    });

    it('listens on port 3000', function (done) {
      this.timeout(3000);
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

  describe('installing bower and npm packages', function () {
    /* Since we can't stub out bower easily when invoking from the cli, call the function directly */
    var commands = require('../lib/commands.js');

    /* Stub out bower.commands */
    var stub = require('./stubber.js').stub;
    var bower = require('bower');
    var npm = require('npm');
    bower.commands = {
      install: stub(function () {
        return {
          on: function () {}
        };
      })
    };

    npm.load = stub(function (config, callback) {
      callback();
    });

    npm.commands = {
      install: stub()
    };

    beforeEach(function (done) {
      exec(newAppCmd, function () {
        process.chdir(appName);
        done();
      });
    });

    afterEach(function () {
      bower.commands.install.called = [];
      npm.commands.install.called = [];
      npm.load.called = [];
    });

    it('calls bower install with a component', function () {
      commands.install('install', ['-f', 'angular']);
      bower.commands.install.called.should.eql([
        [ ['angular'], { save: true } ]
      ]);
    });

    it('calls bower install', function () {
      commands.install('install', ['-f']);
      bower.commands.install.called.should.eql([
        [ [''], { save: true }]
      ]);
    });

    it('calls npm install module', function () {
      commands.install('install', ['-b', 'lodash']);
      npm.load.called.should.be.length(1);
      npm.load.called[0][0].should.eql({ save: true });
      npm.commands.install.called.should.eql([
        [ ['lodash'] ]
      ]);
    });

    it('calls npm install', function () {
      commands.install('install', ['-b']);
      npm.commands.install.called.should.eql([
        [ [''] ]
      ]);
    });
  });
});
