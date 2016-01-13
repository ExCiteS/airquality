'use strict';

/**
 * @ngdoc function
 * @name AQ.controller:LocationEditController
 * @requires factories/AQ.factory:data
 * @requires factories/AQ.factory:state
 * @requires factories/AQ.factory:api
 * @requires factories/AQ.factory:leaflet
 *
 * @description
 * Controller for the LocationEdit state.
 */
AQ.controller('LocationEditController', function ($window, $scope, data, state, api, leaflet) {
  $scope.formGroup = {};
  $scope.location = {
    error: {}
  };

  /**
   * @ngdoc event
   * @name AQ.controller:LocationEditController#data.location
   * @eventOf AQ.controller:LocationEditController
   *
   * @description
   * Keeps track of location and copies its information locally for editing.
   */
  $scope.$watch(
    function () {
      return data.location;
    },
    function (location) {
      if (!_.isEmpty(location)) {
        $scope.location.name = location.name;

        if (!_.isEmpty(location.properties)) {
          $scope.location.height = location.properties.height;
          $scope.location.distance = location.properties.distance;
          $scope.location.characteristics = location.properties.characteristics;
        }
      }
    }
  );

  /**
   * @ngdoc method
   * @name AQ.controller:LocationEditController#update
   * @methodOf AQ.controller:LocationEditController
   *
   * @description
   * Updates location.
   */
  $scope.update = function () {
    $scope.location.error = {};

    _.each($scope.formGroup.form.$error.required, function (field) {
      field.$setDirty();
    });

    if (!$scope.formGroup.form.$invalid) {
      var updatedLocation = _.cloneDeep(data.location);
      var marker = leaflet.marker.toGeoJSON();

      updatedLocation.name = $scope.location.name;
      updatedLocation.geometry = marker.geometry;

      // Limit name to 100 characters
      if (_.size(updatedLocation.name) > 100) {
        updatedLocation.name = updatedLocation.name.substring(0, 97) + '...';
      }

      if (!_.isPlainObject(updatedLocation.properties)) {
        updatedLocation.properties = {};
      }

      if ($scope.location.height) {
        updatedLocation.properties.height = $scope.location.height;
      } else {
        delete updatedLocation.properties.height;
      }

      if ($scope.location.distance) {
        updatedLocation.properties.distance = $scope.location.distance;
      } else {
        delete updatedLocation.properties.distance;
      }

      if (!_.isEmpty($scope.location.characteristics)) {
        updatedLocation.properties.characteristics = $scope.location.characteristics;
      } else {
        delete updatedLocation.properties.characteristics;
      }

      api.updateLocation(updatedLocation).then(
        function (location) {
          state.goToLocation(location.id);

          $window.navigator.notification.alert(
            'The location has been updated.',
            undefined,
            'Success',
            'OK'
          );
        },
        function () {
          $scope.location.error.api = true;

          $window.navigator.notification.alert(
            'An error occurred when trying to update the location. Please try again.',
            undefined,
            'Error',
            'OK'
          );
        }
      );
    }
  };
});
