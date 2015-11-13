'use strict';

/**
 * @ngdoc function
 * @name AQ.controller:LocationsController
 * @requires factories/AQ.factory:data
 * @requires factories/AQ.factory:state
 * @requires factories/AQ.factory:api
 *
 * @description
 * Controller for the Locations state.
 */
AQ.controller('LocationsController', function (data, state, api) {
  state.setTitle('Locations');

  if (_.isEmpty(data.locations)) {
    api.getLocations();
  }
});
