'use strict';

CMAQ.controller('PointController', function ($stateParams, $scope, data, viewport, state, api, leaflet) {
  var pointId = $stateParams.pointId;

  state.setTitle('Point');
  $scope.formGroup = {};
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
      return currentPoint.id === pointId;
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
    } else {
      viewport.message = 'It looks like the data point can\'t be found. Please choose an existing point from the list.';
      state.redirect('points');
    }
  }

  $scope.delete = function () {
    api.deletePoint(pointId).then(
      function () {
        viewport.message = 'The point has been deleted.';
      },
      function () {
        api.getPoints();
        viewport.message = 'An error occurred when trying to delete the point.';
      }
    ).finally(function () {
      state.redirect('points');
    });
  };

  $scope.start = function (measurement) {
    $scope.measurement.error = {};

    _.each($scope.formGroup.form.$error.required, function (field) {
      field.$setDirty();
    });

    if (!$scope.formGroup.form.$error.required) {
      var data = {
        barcode: $scope.measurement.barcode
      };

      api.startMeasurement(data).then(
        function () {
          viewport.message = 'The measurement has started.';
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
});
