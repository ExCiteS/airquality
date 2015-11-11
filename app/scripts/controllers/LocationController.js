'use strict';

AQ.controller('LocationController', function ($timeout, $stateParams, $scope, data, viewport, state, storage, api, leaflet) {
  var locationId = $stateParams.locationId;

  state.setTitle('Location');
  $scope.formGroup = {
    measurements: {}
  };
  $scope.measurement = {
    error: {}
  };

  if (_.isEmpty(data.locations)) {
    api.getLocations().finally(function () {
      getLocation();
    });
  } else {
    getLocation();
  }

  function getLocation() {
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

      $timeout(function () {
        leaflet.map.invalidateSize();
      }, 10);

      _.each(location.measurements, function (measurement) {
        measurement.addResults = false;
      });
    } else {
      viewport.message = 'It looks like the location can\'t be found. Please choose an existing location from the list.';
      state.redirect('locations');
    }
  }

  $scope.delete = function () {
    api.deleteLocation(locationId).then(
      function () {
        viewport.message = 'The location has been deleted.';
      },
      function () {
        api.getLocations();
        viewport.message = 'An error occurred when trying to delete the location.';
      }
    ).finally(function () {
      state.redirect('locations');
    });
  };

  $scope.start = function () {
    $scope.measurement.error = {};

    _.each($scope.formGroup.form.$error.required, function (field) {
      field.$setDirty();
    });

    if (!$scope.formGroup.form.$error.required) {
      var data = {
        barcode: $scope.measurement.barcode.toString()
      };

      if (_.size(data.barcode) < 6) {
        data.barcode = new Array(6 - _.size(data.barcode) + 1).join('0') + data.barcode;
      }

      api.startMeasurement(data).then(
        function () {
          viewport.message = 'The measurement has started. You will receive an email in four weeks to notify you that you should collect the diffusion tube and finish the measurement.';
          $scope.measurement.barcode = undefined;
          $scope.formGroup.form.$setPristine();
          state.redirect('locations');
        },
        function () {
          viewport.message = 'An error occurred when trying to start the measurement. Please try again.';
          $scope.measurement.error.api = true;
        }
      );
    }
  };

  $scope.finish = function (measurement) {
    measurement.finish = true;

    api.updateMeasurement(measurement).then(
      function () {
        viewport.message = 'The measurement has finished. You can add the results when they come in to submit this measurement to Community Maps.';
      },
      function () {
        viewport.message = 'An error occurred when trying to finish the measurement. Please try again.';
        delete measurement.finished;
      }
    );
  };

  $scope.addResults = function (measurement) {
    api.getProjects().finally(function () {
      if (_.isEmpty(data.projects)) {
        viewport.message = 'It looks like there are no projects the measurement can be submitted to.';
      } else {
        measurement.error = {};
        delete measurement.results;
        delete measurement.project;
        var lastProjectUsed = storage.get('LAST_PROJECT_USED');

        if (lastProjectUsed) {
          measurement.project = JSON.parse(lastProjectUsed);
        } else {
          delete measurement.project;
        }

        $scope.formGroup.measurements[measurement.id].form.$setPristine();
        measurement.addResults = true;
      }
    });
  };

  $scope.submit = function (measurement) {
    measurement.error = {};

    _.each($scope.formGroup.measurements[measurement.id].form.$error.required, function (field) {
      field.$setDirty();
    });

    if (!$scope.formGroup.measurements[measurement.id].form.$error.required) {
      var lastProjectUsed = measurement.project;

      measurement.submit = true;
      measurement.addResults = false;

      api.updateMeasurement(measurement).then(
        function () {
          storage.put('LAST_PROJECT_USED', JSON.stringify(lastProjectUsed));
          viewport.message = 'The measurement has been submitted. Shortly it will be converted to a contribution, which can then be accessed using the Community Maps platform.';
        },
        function () {
          viewport.message = 'An error occurred when trying to submit the measurement. Please try again.';
          delete measurement.submitted;
        }
      );
    }
  };

  $scope.remove = function (measurement) {
    api.removeMeasurement(measurement.id).then(
      function () {
        viewport.message = 'The measurement has been removed.';
      },
      function () {
        viewport.message = 'An error occurred when trying to remove the measurement.';
      }
    );
  };
});
