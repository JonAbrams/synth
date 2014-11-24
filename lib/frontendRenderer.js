var path = require('path'),
    Promise = require('bluebird'),
    fs = Promise.promisifyAll( require('fs') ),
    jade = require('jade'),
    ejs = require('ejs'),
    assets = require('./assets.js');

exports.index = function (req, res) {
  var handler = req.handler,
      dataPromise = Promise.cast(null),
      htmlPromise = Promise.cast(null);

  var preloadDataPath;

  if (handler) {
    // Cast to promise in case a non-promise is returned
    dataPromise = handler.func(true)(req, res);
    var htmlPath = '/html/' + handler.resources.join('/') + '/' + handler.funcName + '.html';
    htmlPromise = readHTML(
      path.join(process.cwd(), 'front', htmlPath)
    );
    preloadDataPath = handler.path;
  }

  Promise.props({
    data: dataPromise,
    html: htmlPromise
  })
  .then(function (preload) {
    var apiPrefetchData = {};
    if (preload.data) {
      apiPrefetchData[preloadDataPath] = sanitizeData(preload.data);
    }
    if (preload.html) {
      apiPrefetchData[htmlPath] = preload.html.toString();
    }
    var renderData = {
      appName: req.appName || 'Synth App',
      appVersion: req.appVersion,
      jsFiles: assets.jsFiles,
      cssFiles: assets.cssFiles,
      apiPrefetchData: JSON.stringify(apiPrefetchData)
    };
    for (var key in res.renderData) {
      renderData[key] = res.renderData[key];
    }
    res.render('index', renderData, function (err, html) {
      if (err) throw err;
      res.send(html);
    });
  })
  .catch(function (err) {
    console.error(err.toString());
    if (process.env.NODE_ENV == 'production') {
      res.status(500).send("The server has encountered an error.");
    } else {
      res.status(500).send('<pre>' + err.toString() + '</pre>');
    }
  });
};

var sanitizeData = function (data) {
  return JSON.stringify(data).replace(/\//g, '\\/');
};

var readHTML = function (path) {
  var production = process.env.NODE_ENV == 'production';
  return fs.readFileAsync(path).error(function (err) {
    if (err.cause.code == 'ENOENT') {
      return fs.readFileAsync(path.replace(/\.html$/, '.ejs'))
      .then(function (data) {
        return ejs.render(data.toString(), {
          pretty: !production
        });
      })
      .catch(function (err) {
        if (err.cause.code == 'ENOENT') {
          return jade.renderFile( path.replace(/\.html$/, '.jade'), {
            pretty: !production
          });
        } else throw err;
      });
    } else throw err;
  })
  .catch(function (err) {
    if (err.code != 'ENOENT') throw err;
    return null;
  });
};
