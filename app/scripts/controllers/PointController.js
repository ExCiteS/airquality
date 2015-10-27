'use strict';

CMAQ.controller('PointController', function ($stateParams, $scope, data, viewport, state) {
  var pointId = $stateParams.pointId;

  state.setTitle('Point');
  delete data.point;

  if (_.isEmpty(data.points)) {

  } else {
    var point = _.find(data.points, function (currentPoint) {
      return currentPoint.id === pointId;
    });

    if (point) {
      data.point = point;
    } else {
      viewport.message = 'It looks like the data point can\'t be found. Please choose an existing one.';
      state.redirect();
    }
  }
});
