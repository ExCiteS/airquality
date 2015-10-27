'use strict';

CMAQ.controller('PointsController', function (state, viewport, api) {
  state.setTitle('Points');

  viewport.calling = true;

  api.getPoints().finally(function () {
    viewport.calling = false;
  });
});
