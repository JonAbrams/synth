module.exports = function (mode, port) {
  port = port || process.env.PORT;
  mode = mode || process.env.NODE_ENV;
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
};
