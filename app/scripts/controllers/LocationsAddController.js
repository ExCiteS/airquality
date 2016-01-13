'use strict';

/**
 * @ngdoc function
 * @name AQ.controller:LocationsAddController
 * @requires factories/AQ.factory:viewport
 * @requires factories/AQ.factory:state
 * @requires factories/AQ.factory:api
 * @requires factories/AQ.factory:leaflet
 *
 * @description
 * Controller for the LocationsAdd state.
 */
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
              $window.navigator.notification.alert(
                'It seems like you\'re not allowing to use your current position. You can\'t add new locations without it, but you can still start new or finalise previous measurements.',
                undefined,
                'Error',
                'OK'
              );
              break;

            case 2:
            case 3:
              $window.navigator.notification.alert(
                'There was an error trying to get your current position. You can\'t add new locations without it, but you can still start new or finalise previous measurements.',
                undefined,
                'Error',
                'OK'
              );
              break;

            default:
              $window.navigator.notification.alert(
                'An unknown error occurred.',
                undefined,
                'Error',
                'OK'
              );
          }

          viewport.calling = false;
          state.redirect('locations');
        });
      }, {
        timeout: 15000,
        enableHighAccuracy: true
      }
    );
  } else {
    $window.navigator.notification.alert(
      'It seems like your device does not support geolocation. You can\'t add new locations, but you can still start new or finalise previous measurements.',
      undefined,
      'Error',
      'OK'
    );

    state.redirect('locations');
  }

  /**
   * @ngdoc method
   * @name AQ.controller:LocationsAddController#add
   * @methodOf AQ.controller:LocationsAddController
   *
   * @description
   * Adds new location.
   */
  $scope.add = function () {
    $scope.location.error = {};

    _.each($scope.formGroup.form.$error.required, function (field) {
      field.$setDirty();
    });

    if (!$scope.formGroup.form.$invalid) {
      var data = leaflet.marker.toGeoJSON();

      data.name = $scope.location.name;

      // Limit name to 100 characters
      if (_.size(data.name) > 100) {
        data.name = data.name.substring(0, 97) + '...';
      }

      if (!_.isPlainObject(data.properties)) {
        data.properties = {};
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
          $window.navigator.notification.alert(
            'The location has been added. You can now start your measurements by adding a barcode.',
            undefined,
            'Success',
            'OK'
          );

          state.goToLocation(location.id);
        },
        function () {
          $scope.location.error.api = true;

          $window.navigator.notification.alert(
            'An error occurred when trying to add the location. Please try again.',
            undefined,
            'Error',
            'OK'
          );
        }
      );
    }
  };
});
