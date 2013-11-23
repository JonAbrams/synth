var fs = require('fs');

var rootDir;

function Dir () {
  this.handlers = [];
}

function parsePath (file, action, method) {
  var pathArr = file.replace(rootDir, '').split('/');
  pathArr.pop(); // Remove the script file from the path, will be replaced with the action
  pathArr.shift(); // Remove empty string at front

  var path = pathArr.join('/:id/');
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
    method = /^(get|put|post|delete)(?:[A-Z]|$)/.exec(key);
    method = method && method[1];
    if ( method !== null ) {
      handlers.push({
        file: file,
        method: method.toUpperCase(),
        path: parsePath(file, key, method),
        funcName: key
      });
    }
  }
  return handlers;
}

exports.parse = function (rootDirParam) {
  var parseTree = new Dir();
  rootDir = rootDirParam;

  (function parseDir (parseTree, dir) {
    var contents = fs.readdirSync(dir).sort();
    contents.forEach(function (file) {
      if ( /\.(js|coffee)$/.test(file) ) {
        parseTree.handlers = parseTree.handlers.concat(
          parseFile(dir + '/' + file)
        );
      } else {
        parseTree[file] = new Dir();
        parseDir(parseTree[file], dir + '/' + file);
      }
    });
  })(parseTree, rootDir);

  return parseTree;
};
