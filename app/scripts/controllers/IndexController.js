/**
 * @ngdoc function
 * @name AQ.controller:IndexController
 * @requires factories/AQ.factory:state
 *
 * @description
 * Controller for the Index state.
 */
AQ.controller('IndexController', function (state) {
  'use strict';

  // Automatically redirect to the Locations state
  state.redirect('locations');
});
