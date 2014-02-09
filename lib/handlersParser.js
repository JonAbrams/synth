var fs = require('fs'),
    methods = require('methods'),
    Promise = require('bluebird');

var rootDir;
var resourceStack = [];

function Handler (file, method, path, funcName) {
  this.file = file;
  this.method = method;
  this.path = path;
  this.funcName = funcName;
  this.resources = resourceStack.slice();
}

Handler.prototype.func = function (direct) {
  var func = Promise.method(require(this.file)[this.funcName]);
  return function (req, res) {
    return func(req, res)
    .then(function (result) {
      if (direct) return result;
      if (!result) return;
      return res.json(result);
    });
  };
};

function parsePath (file, action, method) {
  var pathArr = file.replace(rootDir, '').split('/');
  pathArr.pop(); // Remove the script file from the path, will be replaced with the action
  pathArr.shift(); // Remove empty string at front

  var path = '';
  for (var i = 0; i < pathArr.length; i++) {
    path += pathArr[i];
    if (i < pathArr.length - 1) {
      path += '/:' + pathArr[i] + 'Id/';
    }
  }
  action = action.replace(method, '');
  if (method == 'post' && !action || method == 'get' && action == 'Index') {
    // Default action for post, and index action for get do not have an id
  } else if (!action) {
    // Default action for get, put, and delete
    path += '/:id';
  } else {
    // Custom action
    path += '/' + action[0].toLowerCase() + action.substr(1);
  }

  return '/api/' + path;
}

function parseFile (file) {
  var method;
  var module = require(file);
  var handlers = [];
  var methods = ['get', 'put', 'post', 'delete'];
  for (var key in module) {
    method = /^[a-z]+/.exec(key);
    method = method && method[0];
    if ( methods.indexOf(method) != -1 ) {
      handlers.push(
        new Handler(
          file,
          method,
          parsePath(file, key, method),
          key
        )
      );
    } else {
      throw new Error('Unrecognized method: ' + method + ' from ' + file);
    }
  }
  return handlers;
}

var handlers = [];
exports.parse = function (rootDirParam) {
  handlers = [];
  rootDir = rootDirParam;

  (function parseDir (dir) {
    var contents = fs.readdirSync(dir).sort();
    contents.forEach(function (file) {
      if ( /\.(js|coffee)$/.test(file) ) {
        handlers = handlers.concat(
          parseFile(dir + '/' + file)
        );
      } else {
        resourceStack.push(file);
        parseDir(dir + '/' + file);
        resourceStack.pop();
      }
    });
  })(rootDir);

  return handlers;
};

exports.apiHandlers = function () { return handlers; };
