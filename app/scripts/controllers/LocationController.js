'use strict';

/**
 * @ngdoc function
 * @name AQ.controller:LocationController
 * @requires factories/AQ.factory:data
 * @requires factories/AQ.factory:viewport
 * @requires factories/AQ.factory:state
 * @requires factories/AQ.factory:storage
 * @requires factories/AQ.factory:api
 * @requires factories/AQ.factory:leaflet
 *
 * @description
 * Controller for the Location state.
 */
AQ.controller('LocationController', function ($window, $timeout, $stateParams, $scope, data, viewport, state, storage, api, leaflet) {
  var locationId = $stateParams.locationId;

  state.setTitle('Location');
  $scope.formGroup = {
    measurements: {}
  };
  $scope.measurement = {
    error: {}
  };

  if (_.isEmpty(data.locations)) {
    // First get all locations, only then retrieve the current location accessed
    api.getLocations().finally(function () {
      getLocation();
    });
  } else {
    getLocation();
  }

  function getLocation() {
    // Find current location accessed in the list of all locations
    var location = _.find(data.locations, function (currentLocation) {
      return currentLocation.id == locationId;
    });

    if (location && !location.deleted) {
      var center, panning;

      leaflet.init(location);
      data.location = location;

      leaflet.map.on('movestart', function () {
        if (!panning) {
          center = leaflet.map.getCenter();
        } else {
          panning = false;
          center = undefined;
        }
      });

      leaflet.map.on('moveend', function () {
        if (center) {
          panning = true;
          leaflet.map.panTo(center);
        }
      });

      // Make sure the map is displayed correctly
      $timeout(function () {
        leaflet.map.invalidateSize();
      }, 10);

      _.each(location.measurements, function (measurement) {
        measurement.addResults = false;
      });
    } else {
      $window.navigator.notification.alert(
        'The location you\'re trying to access is not found. Please choose an existing location from the list.',
        undefined,
        'Not found',
        'OK'
      );

      state.redirect('locations');
    }
  }

  /**
   * @ngdoc method
   * @name AQ.controller:LocationController#delete
   * @methodOf AQ.controller:LocationController
   *
   * @description
   * Deletes location (when confirmed by user).
   */
  $scope.delete = function () {
    $window.navigator.notification.confirm(
      'Are you sure you want to delete this location?',
      function (buttonIndex) {
        if (buttonIndex === 1) {
          api.deleteLocation(locationId).then(
            function () {
              $window.navigator.notification.alert(
                'The location has been deleted.',
                undefined,
                'Success',
                'OK'
              );
            },
            function () {
              api.getLocations();

              $window.navigator.notification.alert(
                'An error occurred when trying to delete the location.',
                undefined,
                'Error',
                'OK'
              );
            }
          ).finally(function () {
            // Always redirect to Locations state
            state.redirect('locations');
          });
        }
      },
      'Delete?', [
        'Yes, delete', // 1
        'No, leave it' // 2
      ]
    );
  };

  /**
   * @ngdoc method
   * @name AQ.controller:LocationController#start
   * @methodOf AQ.controller:LocationController
   *
   * @description
   * Starts measurement.
   */
  $scope.start = function () {
    $scope.measurement.error = {};

    _.each($scope.formGroup.form.$error.required, function (field) {
      field.$setDirty();
    });

    if (!$scope.formGroup.form.$error.required) {
      var data = {
        barcode: $scope.measurement.barcode.toString() // always a string, not a number
      };

      // Make sure barcode always consists of 6 numbers (add leading zeros)
      if (_.size(data.barcode) < 6) {
        data.barcode = new Array(6 - _.size(data.barcode) + 1).join('0') + data.barcode;
      }

      api.startMeasurement(data).then(
        function () {
          $scope.measurement.barcode = undefined;
          $scope.formGroup.form.$setPristine();

          $window.navigator.notification.alert(
            'The measurement has started. You will receive an email in four weeks to notify you that you should collect the diffusion tube and finish the measurement.',
            undefined,
            'Success',
            'OK'
          );

          state.redirect('locations');
        },
        function () {
          api.getLocations().finally(function () {
            var location = _.find(data.locations, function (currentLocation) {
              return currentLocation.id == locationId;
            });

            if (location) {
              data.location = location;
            }
          });

          $window.navigator.notification.alert(
            'An error occurred when trying to start the measurement. Please try again.',
            undefined,
            'Error',
            'OK'
          );
        }
      );
    }
  };

  /**
   * @ngdoc method
   * @name AQ.controller:LocationController#finish
   * @methodOf AQ.controller:LocationController
   *
   * @description
   * Finishes measurement (when confirmed by user).
   *
   * @param {Object} measurement Measurement to be finished.
   */
  $scope.finish = function (measurement) {
    $window.navigator.notification.confirm(
      'Are you sure you want to finish this measurement?',
      function (buttonIndex) {
        if (buttonIndex === 1) {
          $window.navigator.notification.prompt(
            'Please enter any additional details for this measurement.',
            function (results) {
              if (results.input1.length > 0) {
                measurement.properties.additional_details = results.input1;
              }

              measurement.finish = true;

              api.updateMeasurement(measurement).then(
                function () {
                  $window.navigator.notification.alert(
                    'The measurement has finished. You can add the results when they come in to submit the measurement to Community Maps.',
                    undefined,
                    'Success',
                    'OK'
                  );
                },
                function () {
                  api.getLocations().finally(function () {
                    var location = _.find(data.locations, function (currentLocation) {
                      return currentLocation.id == locationId;
                    });

                    if (location) {
                      data.location = location;
                    }
                  });

                  $window.navigator.notification.alert(
                    'An error occurred when trying to finish the measurement. Please try again.',
                    undefined,
                    'Error',
                    'OK'
                  );
                }
              );
            },
            'Additional details', ['Done']
          );
        }
      },
      'Finish?', [
        'Yes, finish', // 1
        'No, not yet' // 2
      ]
    );
  };

  /**
   * @ngdoc method
   * @name AQ.controller:LocationController#addResults
   * @methodOf AQ.controller:LocationController
   *
   * @description
   * Allows to add results to measurement.
   *
   * @param {Object} measurement Measurement where the results should be added to.
   */
  $scope.addResults = function (measurement) {
    api.getProjects().finally(function () {
      if (_.isEmpty(data.projects)) {
        $window.navigator.notification.alert(
          'It looks like there are no projects the measurement can be submitted to.',
          undefined,
          'Not found',
          'OK'
        );
      } else {
        // Set project automatically to the last one used
        var lastProjectUsed = storage.get('LAST_PROJECT_USED');

        if (lastProjectUsed) {
          measurement.project = JSON.parse(lastProjectUsed);
        } else {
          delete measurement.project;
        }

        measurement.error = {};
        delete measurement.results;
        $scope.formGroup.measurements[measurement.id].form.$setPristine();
        measurement.addResults = true;
      }
    });
  };

  /**
   * @ngdoc method
   * @name AQ.controller:LocationController#submit
   * @methodOf AQ.controller:LocationController
   *
   * @description
   * Submits measurement.
   *
   * @param {Object} measurement Measurement to be submitted.
   */
  $scope.submit = function (measurement) {
    measurement.error = {};

    _.each($scope.formGroup.measurements[measurement.id].form.$error.required, function (field) {
      field.$setDirty();
    });

    if (!$scope.formGroup.measurements[measurement.id].form.$error.required) {
      // Save last project used locally
      storage.put('LAST_PROJECT_USED', JSON.stringify(measurement.project));

      measurement.submit = true;
      measurement.addResults = false;

      api.updateMeasurement(measurement).then(
        function () {
          $window.navigator.notification.alert(
            'The measurement has been submitted. Shortly it will be converted to a contribution, which can then be accessed using the Community Maps platform.',
            undefined,
            'Success',
            'OK'
          );
        },
        function () {
          api.getLocations().finally(function () {
            var location = _.find(data.locations, function (currentLocation) {
              return currentLocation.id == locationId;
            });

            if (location) {
              data.location = location;
            }
          });

          $window.navigator.notification.alert(
            'An error occurred when trying to submit the measurement. Please try again.',
            undefined,
            'Error',
            'OK'
          );
        }
      );
    }
  };

  /**
   * @ngdoc method
   * @name AQ.controller:LocationController#remove
   * @methodOf AQ.controller:LocationController
   *
   * @description
   * Removes measurement (when confirmed by user).
   *
   * @param {Object} measurement Measurement to be removed.
   */
  $scope.remove = function (measurement) {
    $window.navigator.notification.confirm(
      'Are you sure you want to remove this measurement?',
      function (buttonIndex) {
        if (buttonIndex === 1) {
          api.removeMeasurement(measurement.id).then(
            function () {
              $window.navigator.notification.alert(
                'The measurement has been removed.',
                undefined,
                'Success',
                'OK'
              );
            },
            function () {
              api.getLocations().finally(function () {
                var location = _.find(data.locations, function (currentLocation) {
                  return currentLocation.id == locationId;
                });

                if (location) {
                  data.location = location;
                }
              });

              $window.navigator.notification.alert(
                'An error occurred when trying to remove the measurement.',
                undefined,
                'Error',
                'OK'
              );
            }
          );
        }
      },
      'Remove?', [
        'Yes, remove', // 1
        'No, leave it' // 2
      ]
    );
  };
});
