'use strict';

CMAQ.controller('MainController', function ($scope, platformConfig, data, viewport, state) {
  viewport.platform = platformConfig.url;

  $scope.data = data;
  $scope.viewport = viewport;
  $scope.state = state;
});
