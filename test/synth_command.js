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
  touch = require('touch'),
  wrench = require('wrench'); // Recursive file operations

function throwif(err) {
  if (err) throw err;
}

/* Set the temp directories to self-delete on exit */
temp.track();

describe("synth command-line", function () {
  this.timeout(8000);
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
            ' server   Start a local dev server. Must be executed from the app\'s root folder.',
            ' prod     Start a local production server. Will precomiple front-end assets before serving.',
            ' install  Install third-party packages (back-end or front-end) for use by your web app',
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

      it('show server command help text', function (done) {
        exec(synthCmd('help server'), function (err, stdout) {
          stdout.should.eql([
            'synth version ' + pkg.version,
            '',
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
            'Alias: synth i [options]',
            ''
          ].join('\n'));
          done();
        });
      });

      it('shows install help text', function (done) {
        exec(synthCmd('help install'), function (err, stdout) {
          stdout.should.eql([
            'synth version ' + pkg.version,
            '',
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
            '  synth install -b lodash',
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

    it('displays error when back template specified', function (done) {
      exec(newAppCmd + ' -r non_template', function (err, stdout, stderr) {
        stderr.should.eql('The template "non_template" could not be found.\n');
        done();
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
          'front/bower.json',
          'front/css',
          'front/css/cssFiles.json',
          'front/css/readme.md',
          'front/html',
          'front/html/readme.md',
          'front/images',
          'front/images/readme.md',
          'front/index.jade',
          'front/js',
          'front/js/controllers',
          'front/js/controllers/articlesCtrl.js',
          'front/js/jsFiles.json',
          'front/js/main.js',
          'front/js/readme.md',
          'front/misc',
          'front/misc/readme.md',
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

  var createNewProject = function (done) {
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
  };

  var spawnDevServer = function (args) {
    args = args || [];
    return spawn('synth', ['server'].concat(args), {
        cwd: process.cwd(),
        env: {
          'PATH': path.join(__dirname, '../bin') + ':' + process.env['PATH']
        }
      });
  };

  describe('choosing port #', function () {
    beforeEach(createNewProject);

    it('can be set with -p', function (done) {
      var dev = spawnDevServer(['-p', '3001']);
      var count = 0;
      dev.stdout.on('data', function (data) {
        data.toString().should.eql('synth (in development mode) is now listening on port 3001\n');
        dev.kill();
        done();
      });
    });

    it('can be set with --port', function (done) {
      var dev = spawnDevServer(['--port', '3002']);
      var count = 0;
      dev.stdout.on('data', function (data) {
        data.toString().should.eql('synth (in development mode) is now listening on port 3002\n');
        dev.kill();
        done();
      });
    });
  });

  describe('launching prod server', function () {
    var spawnProdServerEnv = function () {
      return spawn('synth', ['server'], {
          cwd: process.cwd(),
          env: {
            'PATH': path.join(__dirname, '../bin') + ':' + process.env['PATH'],
            'NODE_ENV': 'production'
          }
        });
    };

    var spawnProdServerTarget = function () {
      return spawn('synth', ['prod'], {
          cwd: process.cwd(),
          env: {
            'PATH': path.join(__dirname, '../bin') + ':' + process.env['PATH']
          }
        });
    };

    beforeEach(createNewProject);

    var testProdMode = function (prod, done) {
      var count = 0;
      prod.stdout.on('data', function (data) {
        // process.stdout.write(data);
        if (count === 0) {
          data.toString().should.eql('Precompiling JS and CSS files... ');
        } else if (count == 1) {
          data.toString().should.eql('Done\n');
        } else if (count == 2) {
          data.toString().should.eql('synth (in production mode) is now listening on port 3000\n');
          prod.kill();
          done();
        }
        count++;
      });
    };

    it('says that it launched the prod server', function (done) {
      var prod = spawnProdServerEnv();
      testProdMode(prod, done);
    });

    it('launches prod server prod target', function (done) {
      var prod = spawnProdServerTarget();
      testProdMode(prod, done);
    });
  });

  describe('launching dev server', function () {
    beforeEach(createNewProject);

    afterEach(function () {
      fs.unlinkSync( path.join(__dirname, '../node_modules/synth') );
    });

    it('displays the right message', function (done) {
      var dev = spawnDevServer();
      var count = 0;
      dev.stdout.on('data', function (data) {
        if (count === 0) {
          data.toString().should.eql('synth (in development mode) is now listening on port 3000\n');
          touch('back/back-app.js');
        } else if (count == 1){
          data.toString().should.eql('A file was changed, restarting server\n');
        } else {
          data.toString().should.eql('synth (in development mode) is now listening on port 3000\n');
          dev.kill();
          done();
        }
        count++;
      });
    });

    it('listens on port 3000', function (done) {
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
    var stub = require('./lib/stubber.js').stub;
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
        [ [], { save: true }]
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
        [ [] ]
      ]);
    });
  });
});
