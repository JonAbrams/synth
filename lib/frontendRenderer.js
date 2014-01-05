var path = require('path'),
    fs = require('fs');

var jsFilesJson = fs.readFileSync( path.join(process.cwd(), 'front/js/jsFiles.json') );
var jsFiles = JSON.parse(jsFilesJson);
jsFiles.forEach(function (jsFile, index) {
  jsFiles[index] = 'js/' + jsFile.replace(/\.coffee$/, '.js');
});

var cssFilesJson = fs.readFileSync( path.join(process.cwd(), 'front/css/cssFiles.json') );
var cssFiles = JSON.parse(cssFilesJson);
cssFiles.forEach(function (cssFile, index) {
  cssFiles[index] = 'css/' + cssFile.replace(/\.(?:scss|stylus)$/, '.css');
});

exports.index = function (req, res) {
  res.render( 'index', {
    appName: req.appName || 'Synth App',
    jsFiles: jsFiles,
    cssFiles: cssFiles
  });
};
