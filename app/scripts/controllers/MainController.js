'use strict';

CMAQ.controller('MainController', function ($scope, platformConfig, data, viewport, state) {
  $scope.platformConfig = platformConfig;
  $scope.data = data;
  $scope.viewport = viewport;
  $scope.state = state;
});
