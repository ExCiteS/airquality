'use strict';

CMAQ.factory('helpers', function () {
  var helpers = {};

  helpers.serialize = function (object) {
    var params = [];

    if (_.isUndefined(object)) {
      throw new Error('Param not specified');
    } else if (!_.isPlainObject(object)) {
      throw new Error('Param must be plain object');
    }

    for (var key in object) {
      params.push(encodeURIComponent(key) + '=' + encodeURIComponent(object[key]));
    }

    return params.join('&');
  };
});
