'use strict';

AQ.controller('PointsAddController', function ($window, $scope, viewport, state, api, leaflet) {
  $scope.formGroup = {};
  $scope.point = {
    error: {}
  };

  if ('geolocation' in $window.navigator) {
    viewport.calling = true;

    $window.navigator.geolocation.getCurrentPosition(
      function (location) {
        $scope.$apply(function () {
          $scope.point.location = [location.coords.longitude, location.coords.latitude];

          leaflet.init({
            type: 'Point',
            coordinates: $scope.point.location
          });

          leaflet.map.on('moveend', function () {
            leaflet.marker.setLatLng(leaflet.map.getCenter());
          });

          viewport.calling = false;
        });
      },
      function (error) {
        $scope.$apply(function () {
          switch (error.code) {
            case 1:
              viewport.message = 'It seems like you\'re not allowing to use your current location. You can\'t add new data points without a location, but you can still add new or finalise previous measurements.';
              break;

            case 2:
            case 3:
              viewport.message = 'There was an error trying to get your current location. You can\'t add new data points without a location, but you can still add new or finalise previous measurements.';
              break;

            default:
              viewport.message = 'An unknown error occurred.';
          }

          viewport.calling = false;
          state.redirect('points');
        });
      }
    );
  } else {
    viewport.message = 'It seems like your browser does not support geolocation. You can\'t add new data points, but you can still add new or finalise previous measurements.';
    state.redirect('points');
  }

  $scope.add = function () {
    $scope.point.error = {};

    _.each($scope.formGroup.form.$error.required, function (field) {
      field.$setDirty();
    });

    if (!$scope.formGroup.form.$error.required) {
      var data = leaflet.marker.toGeoJSON();

      data.name = $scope.point.name;

      if (_.size(data.name) > 100) {
        data.name = data.name.substring(0, 97) + '...';
      }

      if ($scope.point.height) {
        data.properties.height = $scope.point.height;
      }

      if ($scope.point.distance) {
        data.properties.distance = $scope.point.distance;
      }

      if (!_.isEmpty($scope.point.characteristics)) {
        data.properties.characteristics = $scope.point.characteristics;
      }

      api.addPoint(data).then(
        function (point) {
          viewport.message = 'The point has been added. You can now start your measurement.';
          state.goToPoint(point.id);
        },
        function () {
          viewport.message = 'An error occurred when trying to add the point. Please try again.';
          $scope.measurement.error.api = true;
        }
      );
    }
  };
});
