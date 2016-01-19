/**
 * @ngdoc function
 * @name AQ.controller:RegisterController
 * @requires factories/AQ.factory:data
 * @requires factories/AQ.factory:viewport
 * @requires factories/AQ.factory:state
 * @requires factories/AQ.factory:oauth
 * @requires factories/AQ.factory:helpers
 *
 * @description
 * Controller for the Register state.
 */
AQ.controller('RegisterController', function ($window, $scope, data, viewport, state, oauth, helpers) {
  'use strict';

  state.setTitle('Register');

  // Redirect to Index state when user is already authenticated
  if (!_.isEmpty(data.authentication)) {
    state.redirect('index');
  }

  $scope.registration = {};

  /**
   * @ngdoc method
   * @name AQ.controller:RegisterController#register
   * @methodOf AQ.controller:RegisterController
   *
   * @description
   * Registers user.
   */
  $scope.register = function () {
    var email = $scope.registration.email;
    var displayName = $scope.registration.displayName;
    var password1 = $scope.registration.password1;
    var password2 = $scope.registration.password2;

    $scope.registration.error = {};

    if (!email || !_.isString(email) || !helpers.checkEmail(email)) {
      $scope.registration.error.email = true;
    }

    if (!displayName || !_.isString(displayName)) {
      $scope.registration.error.displayName = true;
    }

    if (!password1 || !_.isString(password1)) {
      $scope.registration.error.password1 = true;
    }

    if (!password2 || !_.isString(password2)) {
      $scope.registration.error.password2 = true;
    }

    if (!$scope.registration.error.password1 && !$scope.registration.error.password2) {
      if (password1.length < 6) {
        $scope.registration.error.passwordTooShort = true;
      } else if (password1 !== password2) {
        $scope.registration.error.passwordsDoNotMatch = true;
      }
    }

    if (_.isEmpty($scope.registration.error)) {
      oauth.register(email, displayName, password1, password2).then(
        function () {
          $window.navigator.notification.alert(
            'You have been registered. Please confirm your email address using the link in the email sent to your mailbox.',
            undefined,
            'Success',
            'OK'
          );

          state.redirect('login');
        },
        function () {
          $scope.registration.error.api = true;

          $window.navigator.notification.alert(
            'There was a n error registering you, probably this email address or display name is already in use.',
            undefined,
            'Error',
            'OK'
          );
        }
      );
    }
  };
});
