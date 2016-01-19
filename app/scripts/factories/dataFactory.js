/**
 * @ngdoc service
 * @name AQ.factory:data
 *
 * @description
 * Factory stores retrieved data.
 */
AQ.factory('data', function () {
  'use strict';

  var data = {};

  /**
   * @ngdoc property
   * @name AQ.factory:data#authentication
   * @propertyOf AQ.factory:data
   * @type {Object}
   *
   * @description
   * Returned from the API authentication object.
   */
  data.authentication = {};

  /**
   * @ngdoc property
   * @name AQ.factory:data#locations
   * @propertyOf AQ.factory:data
   * @type {Object}
   *
   * @description
   * Returned from the API locations object.
   */
  data.locations = null;

  /**
   * @ngdoc property
   * @name AQ.factory:data#location
   * @propertyOf AQ.factory:data
   * @type {Object}
   *
   * @description
   * Single location.
   */
  data.location = null;

  /**
   * @ngdoc property
   * @name AQ.factory:data#projects
   * @propertyOf AQ.factory:data
   * @type {Object}
   *
   * @description
   * Returned from the API projects object.
   */
  data.projects = null;

  /**
   * @ngdoc property
   * @name AQ.factory:data#unsynced
   * @propertyOf AQ.factory:data
   * @type {Object}
   *
   * @description
   * All unsynced data.
   */
  data.unsynced = {
    locations: []
  };

  return data;
});
