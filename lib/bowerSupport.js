var fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    assets = require('./assets.js');

var getComponentFiles = exports.getComponentFiles = function (installed) {
  var componentLists = {}, jsFiles, cssFiles;
  var rootPath = '../bower_components/';

  componentLists.jsFiles = jsFiles = [];
  componentLists.cssFiles = cssFiles = [];

  var processMain = function (mainFile) {
    var path = rootPath + this.componentName + '/' + mainFile.replace(/^\.\//, '');
    if ( /\.js$/.test(path) && jsFiles.indexOf(path) == -1) jsFiles.push(path);
    else if ( /\.css$/.test(path) && cssFiles.indexOf(path) == -1) cssFiles.push(path);
    else {
      /* TODO: Copy misc files to front/misc */
    }
  };

  (function processComponents (components) {
    for (var componentName in components) {
      var component = components[componentName];

      processComponents(component.dependencies);

      if (!component.pkgMeta.main) return;

      var main = component.pkgMeta.main;
      if (typeof main == 'string') main = [main];
      main.forEach( processMain.bind({ componentName: componentName }) );
    }
  })(installed);

  return componentLists;
};

exports.addToManifestFiles = function (installed) {
  var componentLists = getComponentFiles(installed);

  assets.updateManifest('js', componentLists.jsFiles);
  assets.updateManifest('css', componentLists.cssFiles);

  return componentLists;
};
