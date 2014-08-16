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

  if (handler) {
    // Cast to promise in case a non-promise is returned
    dataPromise = handler.func(true)(req, res);
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

var prepareData = function (data) {
  /* 1. Turns the data into a string for rendering */
  /* 2. Escape forward slashes to prevent code injection */
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
      .catch(function (err){
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
