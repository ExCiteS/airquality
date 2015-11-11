module.exports = function (context) {
  'use strict';

  var Q = context.requireCordovaModule('q');
  var deferral = new Q.defer();

  setTimeout(function () {
    console.log('hook.js>> end');
    deferral.resolve();
  }, 1000);

  return deferral.promise;
};
