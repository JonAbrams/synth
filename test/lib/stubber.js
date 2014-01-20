exports.stub = function (callback) {
  var stubbed = function () {
    var args = Array.prototype.slice.call(arguments);
    stubbed.called.push(args);
    return (callback) ? callback.apply(this, args) : function () {};
  }.bind(this);
  stubbed.called = [];
  return stubbed;
};
