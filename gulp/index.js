var gulp = require('gulp');
var coffee = require('gulp-coffee');
var gutil = require('gulp-util');
var merge = require('merge-stream');
var uglify = require('gulp-uglify');
var del = require('del');
var concat = require('gulp-concat');
var ngAnnotate = require('gulp-ng-annotate');
var less = require('gulp-less');
var sass = require('gulp-sass');
var minifyCSS = require('gulp-minify-css');
var rev = require('gulp-rev');
var vfs = require('vinyl-fs');
var through = require('through2');
var fs = require('fs');
var path = require('path');

var synth = require('../synth');

var jsFiles = synth.jsFiles = [];
var cssFiles = synth.cssFiles = [];

var destFolder = 'front/dist';

module.exports = exports = function (gulp) {
  function addTo (arr) {
    return through.obj(function (chunk, enc, done) {
      arr.push(chunk.relative);
      done(null, chunk);
    });
  }

  function writePathToFile (path) {
    return through.obj(function (chunk, enc, done) {
      fs.appendFile(path, chunk.relative + "\n", function (err) {
        done(err, chunk);
      });
    });
  }

  gulp.task('assets', ['js', 'css']);
  gulp.task('prod-assets', ['prod-js', 'prod-css']);

  gulp.task('synth-server', ['assets', 'misc-ln'], function () {
    gulp.watch([jsGlob, coffeeGlob], ['js']);
    gulp.watch([cssGlob, lessGlob, scssGlob, sassGlob], ['css']);
    gulp.watch('front/misc/**/*', ['misc-ln']);
  });
  gulp.task('synth-prod', ['prod-assets'], function () {
    console.log("jsFiles: ", jsFiles);
    console.log("cssFiles: ", cssFiles);
  });

  /* Prepare JS assets */
  var jsGlob = 'front/**/*.js';
  var coffeeGlob = 'front/**/*.coffee';
  var bowerFilter = '!front/bower_components/**/*';

  function srcJsFiles () {
    var srcJsFiles = gulp.src([jsGlob, bowerFilter]);
    var srcCoffeeFiles = gulp.src([coffeeGlob, bowerFilter])
    .pipe(coffee({ bare: true }).on('error', gutil.log));
    return merge(srcJsFiles, srcCoffeeFiles)
    .pipe(ngAnnotate());
  }

  gulp.task('prod-js', ['cleanJS'], function () {
    jsFiles.length = 0;

    return srcJsFiles()
      .pipe(uglify())
      .pipe(concat('main.js'))
      .pipe(rev())
      .pipe(gulp.dest(destFolder))
      .pipe(addTo(jsFiles))
      .pipe(writePathToFile(path.join(destFolder, 'jsFiles')));
  });

  gulp.task('js', ['cleanJS'], function () {
    jsFiles.length = 0;

    return srcJsFiles()
      .pipe(gulp.dest(destFolder))
      .pipe(addTo(jsFiles))
      .pipe(writePathToFile(path.join(destFolder, 'jsFiles')));
  });

  /* Prepare CSS assets */
  var cssGlob = 'front/**/*.css';
  var lessGlob = 'front/**/*.less';
  var sassGlob = 'front/**/*.sass';
  var scssGlob = 'front/**/*.scss';

  function srcCssFiles () {
    var cssFiles = gulp.src([cssGlob, bowerFilter]);
    var lessFiles = gulp.src([lessGlob, bowerFilter])
    .pipe(less());
    var sassFiles = gulp.src([scssGlob, sassGlob, bowerFilter])
    .pipe(sass());

    return merge(cssFiles, lessFiles, sassFiles);
  }
  gulp.task('prod-css', ['cleanCSS'], function () {
    cssFiles.length = 0;

    return srcCssFiles()
      .pipe(minifyCSS())
      .pipe(concat('main.css'))
      .pipe(rev())
      .pipe(gulp.dest(destFolder))
      .pipe(addTo(cssFiles))
      .pipe(writePathToFile(path.join(destFolder, 'cssFiles')));
  });
  gulp.task('css', ['cleanCSS'], function () {
    cssFiles.length = 0;

    return srcCssFiles()
      .pipe(gulp.dest(destFolder))
      .pipe(addTo(cssFiles))
      .pipe(writePathToFile(path.join(destFolder, 'cssFiles')));
  });

  /* Clean assets */
  gulp.task('cleanJS', function (done) {
    return del(['front/dist/**/*.js', 'front/dist/jsFiles'], done);
  });

  gulp.task('cleanCSS', function (done) {
    return del(['front/dist/**/*.css', 'front/dist/cssFiles'], done);
  });

  /* Create symlinks to misc folder */
  gulp.task('misc-ln', function () {
    return gulp.src('front/misc/**/*')
    .pipe(vfs.symlink(destFolder));
  });

  return exports;
};

exports.startServer = require('../lib/startServer');

exports.jsFiles = jsFiles;

exports.cssFiles = cssFiles;
