var fs = require('fs');

var rootDir;

function Dir () {
  this.handlers = [];
}

function parsePath (file, action) {
  var pathArr = file.replace(rootDir, '').split('/');
  pathArr.pop(); // Remove the script file from the path, will be replaced with the action
  pathArr.shift(); // Remove empty string at front

  var path = pathArr.join('/:id/');
  action = action.replace(/^(get|put|post|delete)/, '');
  if (action === '') {
    path += '/:id';
  } else if (action !== 'Index') {
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
        path: parsePath(file, key),
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
    var contents = fs.readdirSync(dir);
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
