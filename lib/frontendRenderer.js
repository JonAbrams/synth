var path = require('path'),
    Promise = require('bluebird'),
    fs = Promise.promisifyAll( require('fs') ),
    jade = require('jade'),
    handlers = require('./handlersParser.js').apiHandlers,
    assets = require('./assets.js');

exports.index = function (req, res) {
  var handler = req.handler,
      dataPromise = Promise.cast(null),
      htmlPromise = Promise.cast(null);

  if (handler) {
    // Cast to promise in case a non-promise is returned
    dataPromise = Promise.cast( handler.func(true)(req, res) );
    var htmlPath = '/html/' + handler.resources.join('/') + '/' + handler.funcName + '.html';
    htmlPromise = readHTML(
      path.join(process.cwd(), 'front', htmlPath)
    );
  }

  Promise.props({
    data: dataPromise,
    html: htmlPromise
  })
  .then(function (preload) {
    var renderData = {
      appName: req.appName || 'Synth App',
      jsFiles: assets.jsFiles,
      cssFiles: assets.cssFiles,
      data: prepareData(preload.data),
      preloadHTML: preload.html,
      preloadHTMLPath: htmlPath
    };
    for (var key in req.renderData) {
      renderData[key] = req.renderData[key];
    }
    res.render( 'index', renderData);
  });
};

var prepareData = function (data) {
  /* 1. Turns the data into a string for rendering */
  /* 2. Escape forward slashes to prevent code injection */
  return JSON.stringify(data).replace(/\//g, '\\/');
};

var readHTML = function (path) {
  return fs.readFileAsync(path).error(function (err) {
    if (err.cause.code == 'ENOENT') {
      // Couldn't find the HTML version, how about jade?
      return fs.readFileAsync( path.replace(/\.html$/, '.jade') )
        .error(function (err) {
          // If the HTML and Jade files aren't found, no big deal, return no data
          if (err.cause.code == 'ENOENT') return null;
          else throw err;
        }).then(function (jadeStr) {
          return jadeStr && jade.render(jadeStr);
        });
    }
    else throw err;
  });
};
