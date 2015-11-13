'use strict';

AQ.controller('LocationsController', function (data, state, api) {
  state.setTitle('Locations');

  if (_.isEmpty(data.locations)) {
    api.getLocations();
  }
});
