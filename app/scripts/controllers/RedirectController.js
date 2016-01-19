/**
 * @ngdoc function
 * @name AQ.controller:RedirectController
 * @requires factories/AQ.factory:state
 *
 * @description
 * Controller for the Redirect state.
 */
AQ.controller('RedirectController', function (state) {
  'use strict';

  // Automatically redirect to the previous state
  state.redirect();
});
