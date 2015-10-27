'use strict';

CMAQ.controller('PointsAddController', function ($window, $scope, viewport, state, api) {
  var map = L.map('map').setView([51.5, -0.1], 10);
  var marker;

  $scope.formGroup = {};

  map.on('moveend', function () {
    if (marker) {
      marker.setLatLng(map.getCenter());
    }
  });

  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: '<a href="http://mapbox.com" target="blank">Mapbox</a>',
    minZoom: 3,
    maxZoom: 19,
    reuseTiles: true,
    id: 'empress.lci7b1km',
    accessToken: 'pk.eyJ1IjoiZW1wcmVzcyIsImEiOiJLRlp4aXN3In0.KS6UybthzK0BTRJhYVkBgg'
  }).addTo(map);

  $scope.point = {
    error: {}
  };

  function errorMessage(message) {
    viewport.message = message;
    state.redirect('points');
  }

  if ('geolocation' in $window.navigator) {
    viewport.calling = true;

    $window.navigator.geolocation.getCurrentPosition(
      function (location) {
        $scope.$apply(function () {
          $scope.point.location = [location.coords.longitude, location.coords.latitude];

          var data = L.geoJson({
            type: 'Point',
            coordinates: $scope.point.location
          }, {
            onEachFeature: function (feature, layer) {
              layer.setIcon(L.icon({
                iconUrl: 'images/marker.png',
                iconSize: [32, 37]
              }));

              marker = layer;
            }
          }).addTo(map);

          data.on('click', function () {
            map.fitBounds(data.getBounds());
          });
          data.fire('click');

          viewport.calling = false;
        });
      },
      function (error) {
        $scope.$apply(function () {
          switch (error.code) {
            case 1:
              errorMessage('It seems like you\'re not allowing to use your current location. You can\'t add new data points without a location, but you can still add new or finalise previous measurements.');
              break;

            case 2:
            case 3:
              errorMessage('There was an error trying to get your current location. You can\'t add new data points without a location, but you can still add new or finalise previous measurements.');
              break;

            default:
              errorMessage('An unknown error occurred.');
          }
        });
      }
    );
  } else {
    errorMessage('It seems like your browser does not support geolocation. You can\'t add new data points, but you can still add new or finalise previous measurements.');
  }

  $scope.add = function () {
    $scope.point.error = {};

    _.each($scope.formGroup.form.$error.required, function (field) {
      field.$setDirty();
    });

    if (!$scope.formGroup.form.$error.required) {
      var data = marker.toGeoJSON();

      data.name = $scope.point.name;

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
          viewport.message = 'The point has been added. Now you can start your measurement.';
          state.goToPoint(point.id);
        },
        function (error) {
          viewport.message = 'An error occurred when trying to add the point. Please try again.';
        }
      );
    }
  };
});
