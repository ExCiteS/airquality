'use strict';

CMAQ.factory('storage', function ($window) {
  var storage = {};

  storage.get = function (name) {
    if (_.isUndefined(name)) {
      throw new Error('Name must be set');
    }

    return $window.localStorage.getItem(name);
  };

  storage.put = function (name, value) {
    if (_.isUndefined(name)) {
      throw new Error('Name must be set');
    }

    $window.localStorage.setItem(name, value);
  };

  storage.remove = function (name) {
    if (_.isUndefined(name)) {
      throw new Error('Name must be set');
    }

    $window.localStorage.removeItem(name);
  };

  return storage;
});
