'use strict';

CMAQ.controller('MainController', function ($scope, appConfig, platformConfig, data, viewport, state) {
  viewport.appTitle = appConfig.title;
  viewport.platformUrl = platformConfig.url;

  $scope.data = data;
  $scope.viewport = viewport;
  $scope.state = state;
});
