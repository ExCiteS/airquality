/**
 * @ngdoc filter
 * @name AQ.filter:empty
 * @function
 *
 * @description
 * Checks if current object is empty
 *
 * @param {Object} object Current plain object.
 * @returns {Boolean} Whether object is empty or not.
 */
AQ.filter('empty', function () {
  'use strict';

  return function (object) {
    return angular.equals({}, object);
  };
});
