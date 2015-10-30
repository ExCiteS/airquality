'use strict';

CMAQ.controller('MainController', function ($scope, data, viewport, state, storage, api) {
  $scope.data = data;
  $scope.viewport = viewport;
  $scope.state = state;

  $scope.$watch(
    function () {
      return data;
    },
    function (data) {
      viewport.unsynced = false;

      if (!_.isEmpty(data.points)) {
        data.unsynced.points = [];

        _.each(data.points, function (point) {
          if ((_.isString(point.id) && point.id.indexOf('x') > -1) || point.deleted) {
            viewport.unsynced = true;
            data.unsynced.points.push(point);
          } else if (!_.isEmpty(point.measurements)) {
            _.each(point.measurements, function (measurement) {
              if ((_.isString(measurement.id) && measurement.id.indexOf('x') > -1) || measurement.deleted || measurement.updated) {
                viewport.unsynced = true;
                data.unsynced.points.push(point);
              }
            });
          }
        });

        storage.put('POINTS', JSON.stringify(data.points));
      }

      if (!_.isEmpty(data.projects)) {
        storage.put('PROJECTS', JSON.stringify(data.projects));
      }
    }, true
  );

  $scope.sync = function () {
    api.sync();
  };
});
