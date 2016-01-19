/**
 * @ngdoc service
 * @name AQ.factory:helpers
 *
 * @description
 * Provides various help methods.
 */
AQ.factory('helpers', function () {
  'use strict';

  var helpers = {};

  /**
   * @ngdoc method
   * @name AQ.factory:helpers#serialize
   * @methodOf AQ.factory:helpers
   *
   * @description
   * Serializes plain object.
   *
   * @param {Object} object Plain object to serialize.
   * @returns {String} Serialized object.
   */
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

  /**
   * @ngdoc method
   * @name AQ.factory:helpers#checkEmail
   * @methodOf AQ.factory:helpers
   *
   * @description
   * Checks if email is valid.
   *
   * @param {String} email Email to check.
   * @returns {Boolean} Returns `true` when email is valid, otherwise `false`.
   */
  helpers.checkEmail = function (email) {
    return /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i.test(email);
  };

  return helpers;
});
