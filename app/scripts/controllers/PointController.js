'use strict';

AQ.controller('PointController', function ($stateParams, $scope, data, viewport, state, storage, api, leaflet) {
  var pointId = $stateParams.pointId;

  state.setTitle('Point');
  $scope.formGroup = {
    measurements: {}
  };
  $scope.measurement = {
    error: {}
  };

  if (_.isEmpty(data.points)) {
    api.getPoints().finally(function () {
      getPoint();
    });
  } else {
    getPoint();
  }

  function getPoint() {
    var point = _.find(data.points, function (currentPoint) {
      return currentPoint.id == pointId;
    });

    if (point && !point.deleted) {
      var center, panning;

      leaflet.init(point);
      data.point = point;

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

      _.each(point.measurements, function (measurement) {
        measurement.addResults = false;
      });
    } else {
      viewport.message = 'It looks like the location can\'t be found. Please choose an existing location from the list.';
      state.redirect('points');
    }
  }

  $scope.delete = function () {
    api.deletePoint(pointId).then(
      function () {
        viewport.message = 'The location has been deleted.';
      },
      function () {
        api.getPoints();
        viewport.message = 'An error occurred when trying to delete the location.';
      }
    ).finally(function () {
      state.redirect('points');
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
          viewport.message = 'The measurement has started. You will receive an email in one month to notify you that you can finish the measurement.';
          $scope.measurement.barcode = undefined;
          $scope.formGroup.form.$setPristine();
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
        viewport.message = 'The measurement has finished. You can add results and submit this measurement to a project.';
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
