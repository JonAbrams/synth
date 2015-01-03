var synth = require('../synth');
var requireUncached = require('./requireUncached');

var fs = require('fs');
var path = require('path');
var _ = require('lodash');

module.exports = function () {
  var port = process.env.PORT || 3000;
  var mode = process.env.NODE_ENV || 'dev';
  var server;
  var restarted = false;
  var connections = [];
  var serverRunning = false;
  var restartServer = function () {
    serverRunning = false;
    server.close(function () {
      startServer();
    });
    connections.forEach(function (connection) {
      connection.end();
    });
  };
  var startServer = function (restarted) {
    var app = loadApp();
    server = app.server;
    if (app && server && typeof server.listen == 'function') {
      server.listen(port);
      server.on('listening', function () {
        serverRunning = true;
        console.log('synth (in ' + mode + ' mode) is now listening on port ' + port);
      });
      server.on('connection', function (connection) {
        connections.push(connection);
        connection.on('close', function () {
          _.pull(connections, connection);
        });
      });
    } else {
      console.log('No synth app detected.');
    }
  };

  return startServer();
};

function loadApp () {
  var nodeProjectExists = fs.existsSync( path.join(process.cwd(), 'package.json') );
  if (!nodeProjectExists) {
    console.error('Could not find a package.json. Is this directory a Synth project?');
    process.exit(1);
  }
  var synthExists = fs.existsSync( path.join(process.cwd(), 'node_modules/synth') );
  if (!synthExists) {
    console.error('Could not find `./node_modules/synth` in this project. Is this directory a Synth project?');
    process.exit(1);
  }

  try {
    return requireUncached( path.join(process.cwd(), 'back/back-app') );
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.error('A module failed to load. Maybe you should try running `synth install -b`');
      process.exit(1);
    } else throw err;
  }
}
