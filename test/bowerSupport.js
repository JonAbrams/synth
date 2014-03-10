require('should');

var bowerSupport = require('../lib/bowerSupport.js'),
    temp = require('temp'),     // Creates temporary directories
    path = require('path'),
    fs = require('fs');

/* Set the temp directories to self-delete on exit */
temp.track();

describe('bowerSupport', function () {
  var jquery = {
    pkgMeta: { main: 'jquery.js'}
  };
  var jqueryui = {
    pkgMeta: { main: 'jquery-ui.js' },
    dependencies: {
      jquery: jquery
    }
  };
  var bootstrap = {
    pkgMeta: {
      main: [
        './dist/js/bootstrap.js',
        './dist/css/bootstrap.css',
        './dist/fonts/glyphicons-halflings-regular.eot',
        './dist/fonts/glyphicons-halflings-regular.svg',
        './dist/fonts/glyphicons-halflings-regular.ttf',
        './dist/fonts/glyphicons-halflings-regular.woff'
      ]
    },
    dependencies: {
      jquery: jquery
    }
  };
  var installed = {
    'bootstrap': bootstrap,
    'jquery-ui': jqueryui,
    'jquery': jquery
  };
  describe('.getComponentFiles', function () {
    it('return the list of file paths in the right order', function () {
      bowerSupport.getComponentFiles(installed).should.eql({
        jsFiles: [
          '../bower_components/jquery/jquery.js',
          '../bower_components/bootstrap/dist/js/bootstrap.js',
          '../bower_components/jquery-ui/jquery-ui.js'
        ],
        cssFiles: [
          '../bower_components/bootstrap/dist/css/bootstrap.css'
        ]
      });
    });
  });

  describe('.addToManifestFiles', function () {
    before(function () {
      var rootDir = temp.mkdirSync('synth-bower-support-tests');
      process.chdir(rootDir);
      fs.mkdirSync('front');
      process.chdir('front');
      fs.mkdirSync('js');
      fs.writeFileSync('js/jsFiles.json', '[]');
      fs.mkdirSync('css');
      fs.writeFileSync('css/cssFiles.json',
        JSON.stringify([
          'existing.css',
          '../bower_components/bootstrap/dist/css/bootstrap.css'
        ])
      );
      bowerSupport.addToManifestFiles(installed);
      process.chdir(rootDir);
    });

    it('creates the manifest files', function () {
      fs.existsSync('front/js/jsFiles.json').should.eql(true);
      fs.existsSync('front/css/cssFiles.json').should.eql(true);
    });

    it('creates the right contents for jsFiles.json', function () {
      JSON.parse( fs.readFileSync('front/js/jsFiles.json', { encoding: 'utf8' }) )
      .should.eql([
        '../bower_components/jquery/jquery.js',
        '../bower_components/bootstrap/dist/js/bootstrap.js',
        '../bower_components/jquery-ui/jquery-ui.js'
      ]);
    });

    it('creates the right contents for cssFiles.json', function () {
      JSON.parse( fs.readFileSync('front/css/cssFiles.json', { encoding: 'utf8' }) )
      .should.eql([
        '../bower_components/bootstrap/dist/css/bootstrap.css',
        'existing.css'
      ]);
    });
  });
});
