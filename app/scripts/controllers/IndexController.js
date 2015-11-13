'use strict';

/**
 * @ngdoc function
 * @name AQ.controller:IndexController
 * @requires factories/AQ.factory:state
 *
 * @description
 * Controller for the Index state.
 */
AQ.controller('IndexController', function (state) {
  // Automatically redirect to Locations state
  state.redirect('locations');
});
