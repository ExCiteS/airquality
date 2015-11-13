'use strict';

/**
 * @ngdoc service
 * @name AQ.factory:storage
 *
 * @description
 * Stores, retrieves and removes items, using localStorage
 */
AQ.factory('storage', function ($window) {
  var storage = {};

  /**
   * @ngdoc method
   * @name AQ.factory:storage#get
   * @methodOf AQ.factory:storage
   *
   * @description
   * Retrieves stored item.
   *
   * @param {String} name Name of an item.
   * @returns {String} Value of an item.
   */
  storage.get = function (name) {
    if (_.isUndefined(name)) {
      throw new Error('Name must be set');
    }

    return $window.localStorage.getItem(name);
  };

  /**
   * @ngdoc method
   * @name AQ.factory:storage#put
   * @methodOf AQ.factory:storage
   *
   * @description
   * Stores item.
   *
   * @param {String} name Name of an item.
   * @param {String} value Value of an item to store.
   */
  storage.put = function (name, value) {
    if (_.isUndefined(name)) {
      throw new Error('Name must be set');
    }

    $window.localStorage.setItem(name, value);
  };

  /**
   * @ngdoc method
   * @name AQ.factory:storage#remove
   * @methodOf AQ.factory:storage
   *
   * @description
   * Removes item.
   *
   * @param {String} name Name of an item.
   */
  storage.remove = function (name) {
    if (_.isUndefined(name)) {
      throw new Error('Name must be set');
    }

    $window.localStorage.removeItem(name);
  };

  return storage;
});
