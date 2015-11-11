'use strict';

AQ.controller('LocationsAddController', function ($window, $scope, viewport, state, api, leaflet) {
  $scope.formGroup = {};
  $scope.location = {
    error: {}
  };

  if ('geolocation' in $window.navigator) {
    viewport.calling = true;

    $window.navigator.geolocation.getCurrentPosition(
      function (location) {
        $scope.$apply(function () {
          $scope.location.location = [location.coords.longitude, location.coords.latitude];

          leaflet.init({
          type: 'Point',
            coordinates: $scope.location.location
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
              viewport.message = 'It seems like you\'re not allowing to use your current position. You can\'t add new locations without it, but you can still start new or finalise previous measurements.';
              break;

            case 2:
            case 3:
              viewport.message = 'There was an error trying to get your current position. You can\'t add new locations without it, but you can still start new or finalise previous measurements.';
              break;

            default:
              viewport.message = 'An unknown error occurred.';
          }

          viewport.calling = false;
          state.redirect('locations');
        });
      }
    );
  } else {
    viewport.message = 'It seems like your browser does not support geolocation. You can\'t add new locations, but you can still start new or finalise previous measurements.';
    state.redirect('locations');
  }

  $scope.add = function () {
    $scope.location.error = {};

    _.each($scope.formGroup.form.$error.required, function (field) {
      field.$setDirty();
    });

    if (!$scope.formGroup.form.$error.required) {
      var data = leaflet.marker.toGeoJSON();

      data.name = $scope.location.name;

      if (_.size(data.name) > 100) {
        data.name = data.name.substring(0, 97) + '...';
      }

      if ($scope.location.height) {
        data.properties.height = $scope.location.height;
      }

      if ($scope.location.distance) {
        data.properties.distance = $scope.location.distance;
      }

      if (!_.isEmpty($scope.location.characteristics)) {
        data.properties.characteristics = $scope.location.characteristics;
      }

      api.addLocation(data).then(
        function (location) {
          viewport.message = 'The location has been added. You can now start your measurements by adding a barcode.';
          state.goToLocation(location.id);
        },
        function () {
          viewport.message = 'An error occurred when trying to add the location. Please try again.';
          $scope.location.error.api = true;
        }
      );
    }
  };
});
