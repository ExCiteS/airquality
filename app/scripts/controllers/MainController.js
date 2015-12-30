'use strict';

/**
 * @ngdoc function
 * @name AQ.controller:MainController
 * @requires factories/AQ.factory:data
 * @requires factories/AQ.factory:viewport
 * @requires factories/AQ.factory:state
 * @requires factories/AQ.factory:storage
 * @requires factories/AQ.factory:oauth
 * @requires factories/AQ.factory:api
 *
 * @description
 * Main controller of the app.
 */
AQ.controller('MainController', function ($window, $scope, data, viewport, state, storage, oauth, api) {
  $scope.data = data;
  $scope.viewport = viewport;
  $scope.state = state;

  /**
   * @ngdoc event
   * @name AQ.controller:MainController#data
   * @eventOf AQ.controller:MainController
   *
   * @description
   * Keeps track of all unsynced data. Also stores locations and projects locally.
   */
  $scope.$watch(
    function () {
      return data;
    },
    function (data) {
      viewport.unsynced = false;
      viewport.finished = false;

      if (data.locations) {
        data.unsynced.locations = [];

        _.each(data.locations, function (location) {
          var locationAdded;

          if ((_.isString(location.id) && location.id.indexOf('x') > -1) || location.deleted) {
            viewport.unsynced = true;
            data.unsynced.locations.push(location);
            // Make sure location is added to the list of unsynced locations only once
            locationAdded = true;
          }

          if (!_.isEmpty(location.measurements)) {
            _.each(location.measurements, function (measurement) {
              if ((_.isString(measurement.id) && measurement.id.indexOf('x') > -1) || measurement.deleted || measurement.updated) {
                // Add the whole location to the list of unsynced locations even only measurements are unsynced (this is sorted out later)
                if (!locationAdded) {
                  viewport.unsynced = true;
                  data.unsynced.locations.push(location);
                  locationAdded = true;
                }
              }

              // Inform viewport that there are finished measurements (and sheet can be sent)
              if (measurement.finished) {
                viewport.finished = true;
              }
            });
          }
        });

        storage.put('LOCATIONS', JSON.stringify(data.locations));
      }

      if (data.projects) {
        storage.put('PROJECTS', JSON.stringify(data.projects));
      }
    }, true
  );

  /**
   * @ngdoc method
   * @name AQ.controller:MainController#sync
   * @methodOf AQ.controller:MainController
   *
   * @description
   * Syncs all unsynced data.
   */
  $scope.sync = function () {
    api.sync();
  };

  /**
   * @ngdoc method
   * @name AQ.controller:MainController#sendSheet
   * @methodOf AQ.controller:MainController
   *
   * @description
   * Sends a CSV sheet.
   */
  $scope.sendSheet = function () {
    api.sendSheet().then(
      function () {
        $window.navigator.notification.alert(
          'The CSV sheet has been sent to your email address. You can always get another copy at any time.',
          undefined,
          'Success',
          'OK'
        );
      },
      function () {
        $window.navigator.notification.alert(
          'An error occurred when trying to send a CSV sheet. Please try again.',
          undefined,
          'Error',
          'OK'
        );
      }
    );
  };

  /**
   * @ngdoc method
   * @name AQ.controller:MainController#logout
   * @methodOf AQ.controller:MainController
   *
   * @description
   * Logs user out.
   */
  $scope.logout = function () {
    var message = 'Are you sure you want to log out?';

    // Add additional message when unsynced data is present
    if (viewport.unsynced) {
      message += ' All unsynced data will be lost.';
    }

    $window.navigator.notification.confirm(
      message,
      function (buttonIndex) {
        if (buttonIndex === 1) {
          oauth.revoke().finally(function () {
            state.redirect('index');
          });
        }
      },
      'Log out?', [
        'Log me out', // 1
        'Stay logged in' // 2
      ]
    );
  };
});
