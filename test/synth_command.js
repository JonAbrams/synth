require('should');
var mkdirp = require('mkdirp'),
  path = require('path'),
  Promise = require('bluebird'),
  exec = Promise.promisify(require('child_process').exec),
  spawn = require('child_process').spawn,
  os = require('os'),
  fs = require('fs'),
  _ = require('lodash'),
  pkg = require('../package.json'),
  request = require('supertest'),
  temp = require('temp'),     // Creates temporary directories
  touch = require('touch'),
  wrench = require('wrench'); // Recursive file operations

/* Set the temp directories to self-delete on exit */
temp.track();

describe("synth command-line", function () {
  this.timeout(10000);
  beforeEach(function () {
    var rootDir = temp.mkdirSync('synth-tests');
    process.chdir(rootDir);
  });

  var synthCmd = function (args) {
    args = args || '';
    return path.join(__dirname, '../bin/synth ') + args;
  };

  var createNewProject = function () {
    var appName = 'test_app-' + _.random(10000);
    var nodeModulesPath = path.join(__dirname, '../node_modules');
    var synthPath = path.join(__dirname, '..');
    return exec(synthCmd('new ' + appName)).then(function (stdout) {
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
    });
  };

  var appName = 'test_app-' + _.random(10000);
  var newAppCmd = synthCmd('new ' + appName);

  describe('help text', function () {
    describe('unrecognized command', function () {
      it('says the command is unrecognized', function () {
        return exec(synthCmd('huh')).spread(function (stdout) {
          stdout.should.contain('Unrecognized command: huh');
        });
      });
    });

    describe('basic help', function () {
      it('shows the right text', function () {
        return exec(synthCmd()).spread(function (stdout) {
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
            ' routes   Shows the various HTTP paths that the current Synth project listens to.',
            ' help     Shows you this text, or if you pass in another command, it tells you',
            '          more about it. e.g. `synth help new`',
            ''
          ].join('\n'));
        });
      });

      it('shows new help text', function () {
        return exec(synthCmd('help new')).spread(function (stdout) {
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
        });
      });

      it('show server command help text', function () {
        exec(synthCmd('help server')).spread(function (stdout) {
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
        });
      });

      it('shows install help text', function () {
        return exec(synthCmd('help install')).spread(function (stdout) {
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
        });
      });

      it('shows routes help text', function () {
        return exec(synthCmd('help routes')).spread(function (stdout) {
          stdout.should.eql([
            'synth version ' + pkg.version,
            '',
            'Usage: synth routes',
            '',
            'Description:',
            '  The `synth routes` command displays the HTTP paths and method that',
            '  the current Synth app listens for.',
            '',
            'Example:',
            '  synth routes',
            ''
          ].join('\n'));
        });
      });
    });
  });

  describe('routes', function () {
    beforeEach(createNewProject);

    it('shows routes', function () {
      delete process.env.NODE_ENV;
      return exec(synthCmd('routes')).spread(function (stdout) {
        stdout.should.eql([
          'API Routes:',
          '---------------',
          'GET /api/tweets ./back/resources/tweets/getTweets.js#getIndex',
          ''
        ].join('\n'));
      });
    });
  });

  describe('project generation', function () {
    it('creates a directory', function () {
      return exec(newAppCmd).spread(function (stdout) {
        fs.readdirSync('.').should.contain(appName);
      });
    });

    it('shows the right messages in the console', function () {
      return exec(newAppCmd).spread(function (stdout) {
        stdout.should.eql('Successfully created a new synth app in ' + appName + '\n');
        return exec(newAppCmd).spread(function (stdout) {
          stdout.should.eql('Oops, that folder already exists. Try specifying a different name.\n');
        });
      });
    });

    it('displays error when back template specified', function () {
      return exec(newAppCmd + ' -t non_template').catch(function (err) {
        err.message.should.eql('Command failed: The template "non_template" could not be found.\n');
      });
    });

    it('populates the project with key files', function () {
      return exec(newAppCmd).spread(function (stdout) {
        wrench.readdirSyncRecursive(appName).sort().should.eql([
          '.bowerrc',
          '.gitignore',
          'back',
          'back/back-app.js',
          'back/generateTweets.js',
          'back/resources',
          'back/resources/tweets',
          'back/resources/tweets/getTweets.js',
          'back/services',
          'back/services/db.js',
          'back/services/params.js',
          'bower.json',
          'front',
          'front/css',
          'front/css/cssFiles',
          'front/css/main.scss',
          'front/css/readme.md',
          'front/html',
          'front/html/readme.md',
          'front/html/tweets',
          'front/html/tweets/getIndex.jade',
          'front/images',
          'front/images/readme.md',
          'front/index.jade',
          'front/js',
          'front/js/controllers',
          'front/js/controllers/tweets.js',
          'front/js/front-app.js',
          'front/js/jsFiles',
          'front/js/readme.md',
          'front/misc',
          'front/misc/readme.md',
          'front/misc/robots.txt',
          'package.json'
        ]);
      });
    });

    it('renders templates', function () {
      return exec(newAppCmd).spread(function (stdout) {
        fs.readFileSync( path.join(appName, 'package.json'), { encoding: 'utf8' } ).should.contain('"name": "' + appName + '"');
      });
    });
  });

  var spawnDevServer = function (args) {
    args = args || [];
    return spawn('synth', ['server'].concat(args), {
        cwd: process.cwd(),
        env: {
          'PATH': path.join(__dirname, '../bin') + ':' + process.env.PATH
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

  describe('missing modules', function () {
    beforeEach(function () {
      process.chdir( path.join(__dirname, 'missing-modules-project') );
    });
    it('prints proper error', function () {
      return exec( synthCmd('server') ).catch(function (err) {
        err.message.should.eql('Command failed: A module failed to load. Maybe you should try running `synth install -b`\n');
      });
    });
  });

  describe('non-synth project', function () {
    beforeEach(function () {
      process.chdir( path.join(__dirname, 'not-synth-project') );
    });
    it('prints proper error', function () {
      return exec( synthCmd('server') ).catch(function (err) {
        err.message.should.eql('Command failed: Could not find `./node_modules/synth` in this project. Is this directory a Synth project?\n');
      });
    });
  });

  describe('launching prod server', function () {
    var spawnProdServerEnv = function () {
      return spawn('synth', ['server'], {
          cwd: process.cwd(),
          env: {
            'PATH': path.join(__dirname, '../bin') + ':' + process.env.PATH,
            'NODE_ENV': 'production'
          }
        });
    };

    var spawnProdServerTarget = function () {
      return spawn('synth', ['prod'], {
          cwd: process.cwd(),
          env: {
            'PATH': path.join(__dirname, '../bin') + ':' + process.env.PATH
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
    var commands;
    var stub;
    var bower;
    var npm;

    before(function (){
      /* Since we can't stub out bower easily when invoking from the cli, call the function directly */
      commands = require('../lib/commands.js');

      /* Stub out bower.commands */
      stub = require('./lib/stubber.js').stub;
      bower = require('bower');
      npm = require('npm');
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
    });

    beforeEach(function () {
      return exec(newAppCmd).then(function () {
        process.chdir(appName);
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
        [ ['angular'], { save: true, forceLatest: true } ]
      ]);
    });

    it('calls bower install', function () {
      commands.install('install', ['-f']);
      bower.commands.install.called.should.eql([
        [ [], { save: true, forceLatest: true }]
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

  describe('uninstalling bower and npm packages', function () {
    var commands;
    var stub;
    var bower;
    var npm;

    before(function(){
       /* Since we can't stub out bower easily when invoking from the cli, call the function directly */
      commands = require('../lib/commands.js');

      /* Stub out bower.commands */
      stub = require('./lib/stubber.js').stub;
      bower = require('bower');
      npm = require('npm');
      bower.commands = {
        uninstall: stub(function () {
          return {
            on: function () {}
          };
        }),
        info: stub(function(){
          return {
            on: function(name,callback){
              callback({
                latest:{
                  "name": "angular",
                  "version": "1.2.18",
                  "main": "./angular.js",
                  "dependencies": {},
                  "homepage": "https://github.com/angular/bower-angular",
                  "_release": "1.2.18",
                  "_resolution": {
                    "type": "version",
                    "tag": "v1.2.18",
                    "commit": "0ca814f33e56902d1500e4d5a6742d09f089b3af"
                  },
                  "_source": "git://github.com/angular/bower-angular.git",
                  "_target": "1.2.18",
                  "_originalSource": "angular"
                }
              });
            }
          };
        })
      };

      npm.load = stub(function (config, callback) {
        callback();
      });

      npm.commands = {
        uninstall: stub()
      };
    });

    beforeEach(function () {
      return exec(newAppCmd).then(function () {
        process.chdir(appName);
      });
    });

    afterEach(function () {
      bower.commands.uninstall.called = [];
      npm.commands.uninstall.called = [];
      npm.load.called = [];
    });

    it('calls bower uninstall with a component', function () {
      commands.uninstall('uninstall', ['-f', 'angular']);
      bower.commands.uninstall.called.should.eql([
        [ ['angular'], { save: true } ]
      ]);
    });

    it('calls bower uninstall', function () {
      commands.uninstall('uninstall', ['-f']);
      bower.commands.uninstall.called.should.eql([
        [ [], { save: true }]
      ]);
    });

    it('calls npm uninstall module', function () {
      commands.uninstall('uninstall', ['-b', 'lodash']);
      npm.load.called.should.be.length(1);
      npm.load.called[0][0].should.eql({ save: true });
      npm.commands.uninstall.called.should.eql([
        [ ['lodash'] ]
      ]);
    });

    it('calls npm uninstall', function () {
      commands.uninstall('uninstall', ['-b']);
      npm.commands.uninstall.called.should.eql([
        [ [] ]
      ]);
    });
  });
});
