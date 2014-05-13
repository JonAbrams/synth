/*
  This is a replacement for the built-in require() function
  This one will re-read the file from disk, thereby loading any new changes
  in the specified module.
*/
module.exports = function requireUncached(modulePath){
  /* Recursively delete from the require-cache
     the specified module and all of its children */
  (function deleteCached (modulePath) {
    var module = require.cache[modulePath];
    if (!module) return;
    module.children.forEach(function (module) {
      deleteCached(module.id);
    });
    delete require.cache[modulePath];
  })(require.resolve(modulePath));

  return require(modulePath);
};
