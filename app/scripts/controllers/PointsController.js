'use strict';

CMAQ.controller('PointsController', function (data, state, viewport, api) {
  state.setTitle('Points');

  if (_.isEmpty(data.points)) {
    api.getPoints();
  }
});
