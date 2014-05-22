var Promise = require('bluebird');

/*
 * A timeout function that takes a promise and timeout length (ms)
 * If the timeout occurs first, throws an error.
 * If the promise occurs first, it cancels the timeout
 */
exports.pTimeout = function (promise, time, errMessage) {
  errMessage = errMessage || "Operation timed out after " + time + " ms";
  var timeout;

  var delay = function () {
    return new Promise(function (resolve) {
      timeout = setTimeout(resolve, time);
    });
  };

  var pTimeout = delay(time).then(function () {
    throw {
      message: errMessage,
      public: true
    };
  });

  // When the promise is resolved cancel the timeout
  var newPromise = promise.then(function (res) {
    clearTimeout(timeout);
    return res;
  });

  return Promise.race([newPromise, pTimeout]);
};
