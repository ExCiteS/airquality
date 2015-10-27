'use strict';

CMAQ.controller('MainController', function ($scope, appConfig, platformConfig, data, viewport, state, api) {
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
      if (!_.isEmpty(data)) {
        viewport.unsynced = false;

        data.unsynced.points = [];

        if (!_.isEmpty(data.points)) {
          _.each(data.points, function (point) {
            if (_.isString(point.id) && point.id.indexOf('x') > -1) {
              viewport.unsynced = true;
              data.unsynced.points.push(point);
            }
          });
        }
      }
    }, true
  );

  $scope.sync = function () {
    api.sync();
  };
});
