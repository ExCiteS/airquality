'use strict';

CMAQ.controller('MainController', function ($scope, appConfig, platformConfig, data, viewport, state, storage, api) {
  viewport.appTitle = appConfig.title;
  viewport.platformUrl = platformConfig.url;

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

        if (!_.isEmpty(data.points)) {
          _.each(data.points, function (point) {
            if ((_.isString(point.id) && point.id.indexOf('x') > -1) || point.deleted) {
              viewport.unsynced = true;
              data.unsynced.points.push(point);
            } else {
              _.each(point.measurements, function (measurement) {
                if ((_.isString(measurement.id) && measurement.id.indexOf('x') > -1) || measurement.deleted) {
                  viewport.unsynced = true;
                  data.unsynced.points.push(point);
                }
              });
            }
          });
        }

        storage.put('POINTS', JSON.stringify(data.points));
      }
    }, true
  );

  $scope.sync = function () {
    api.sync();
  };
});
