var gulp = require('gulp');
var jade = require('gulp-jade');
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
var sourcemaps = require('gulp-sourcemaps');
var vfs = require('vinyl-fs');
var fs = require('fs');
var path = require('path');
var transform = require('vinyl-transform');
var browserify = require('browserify');

var synth = require('../synth');

var destFolder = 'front/dist';

var gulpBrowserify = function (options) {
  return transform(function (filename) {
    return browserify({
      entries: filename,
      debug: options.debug
    }).bundle();
  });
};

module.exports = exports = function (gulp) {
  gulp.task('assets', ['js', 'css', 'html']);

  gulp.task('synth-server', ['assets', 'misc-ln'], function () {
    gulp.watch(['front/**/*.js', '!front/dist/**/*'], ['js']);
    gulp.watch(['front/**/*.css','!front/dist/**/*'], ['css']);
    gulp.watch(['front/**/*.html', '!front/dist/**/*'] ['html']);
    gulp.watch('front/misc/**/*', ['misc-ln']);
  });

  gulp.task('js', function () {
    return gulp.src('front/js/index.js')
      .pipe(gulpBrowserify({ debug: true }))
      .on('error', gutil.log)
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(ngAnnotate())
      .pipe(uglify())
      .pipe(concat('index.js'))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(destFolder));
  });

  gulp.task('css', function () {
    var cssFile = gulp.src('front/css/index.css')
      .pipe(sourcemaps.init());
    var lessFile = gulp.src('front/css/index.less')
      .pipe(sourcemaps.init())
      .pipe(less())
      .on('error', gutil.log);
    var sassFile = gulp.src(['front/css/index.sass', 'front/css/index.scss'])
      .pipe(sourcemaps.init())
      .pipe(sass())
      .on('error', gutil.log);

    return merge(cssFile, lessFile, sassFile)
      .pipe(concat('index.css'))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(destFolder));
  });

  /* Clean assets */
  gulp.task('cleanJS', function (done) {
    return del('front/dist/index.js*', done);
  });

  gulp.task('cleanCSS', function (done) {
    return del('front/dist/index.css*', done);
  });

  /* Create symlinks to misc folder */
  gulp.task('misc-ln', function () {
    return gulp.src('front/misc/**/*')
      .pipe(vfs.symlink(destFolder));
  });

  gulp.task('jade', function () {

  });

  gulp.task('html', ['jade'], function () {
    var jadeFiles = gulp.src('front/**/*.jade').pipe(jade());
    var htmlFiles = gulp.src('front/**/*.html');

    return merge(htmlFiles, jadeFiles)
      .pipe(gulp.dest(destFolder));
  });

  return exports;
};

exports.startServer = require('../lib/startServer');
