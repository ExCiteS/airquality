/**
 * @ngdoc service
 * @name AQ.factory:viewport
 *
 * @description
 * Factory stores viewport settings.
 */
AQ.factory('viewport', function () {
  'use strict';

  var viewport = {};

  /**
   * @ngdoc property
   * @name AQ.factory:viewport#history
   * @propertyOf AQ.factory:viewport
   * @type {Object}
   *
   * @description
   * History of current/previous states (with params).
   */
  viewport.history = {};

  return viewport;
});
