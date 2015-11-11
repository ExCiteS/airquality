'use strict';

AQ.controller('MainController', function ($window, $scope, data, viewport, state, storage, oauth, api) {
  $scope.data = data;
  $scope.viewport = viewport;
  $scope.state = state;

  // Watch data factory...
  $scope.$watch(
    function () {
      return data;
    },
    function (data) {
      viewport.unsynced = false;

      if (data.locations) {
        // ...and keep track of all unsynced data
        data.unsynced.locations = [];

        _.each(data.locations, function (location) {
          var locationAdded;

          if ((_.isString(location.id) && location.id.indexOf('x') > -1) || location.deleted) {
            viewport.unsynced = true;
            data.unsynced.locations.push(location);
            // Make sure location is added to the list of unsynced locations only once
            locationAdded = true;
          } else if (!_.isEmpty(location.measurements)) {
            _.each(location.measurements, function (measurement) {
              if ((_.isString(measurement.id) && measurement.id.indexOf('x') > -1) || measurement.deleted || measurement.updated) {
                // Add the whole location to the list of unsynced locations even only measurements are unsynced (this is sorted out later)
                if (!locationAdded) {
                  viewport.unsynced = true;
                  data.unsynced.locations.push(location);
                  locationAdded = true;
                }
              }
            });
          }
        });

        // ...also store locations locally
        storage.put('LOCATIONS', JSON.stringify(data.locations));
      }

      if (data.projects) {
        // ...and don't forget to store projects locally too
        storage.put('PROJECTS', JSON.stringify(data.projects));
      }
    }, true
  );

  $scope.sync = function () {
    api.sync();
  };

  $scope.logout = function () {
    var message = 'Are you sure you want to log out?';

    // Add additional message when unsynced data is present
    if (viewport.unsynced) {
      message += ' All unsynced data will be lost.';
    }

    $window.navigator.notification.confirm(
      message,
      function (buttonIndex) {
        // Log out when "Log me out" button is pressed
        if (buttonIndex === 2) {
          oauth.revoke().finally(function () {
            state.redirect('index');
          });
        }
      },
      'Log out?', [
        'Stay logged in', // 1
        'Log me out' //2
      ]
    );
  };
});
