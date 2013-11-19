var fs = require('fs');

function Dir () {
  this.handlers = [];
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
        funcName: key
      });
    }
  }
  return handlers;
}


exports.parse = function (rootDir) {
  var parseTree = new Dir();

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
