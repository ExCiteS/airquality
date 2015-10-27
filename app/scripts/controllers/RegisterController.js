'use strict';

CMAQ.controller('RegisterController', function ($scope, data, viewport, state, oauth, helpers) {
  state.setTitle('Register');
  $scope.registration = {};

  if (!_.isEmpty(data.authentication)) {
    state.redirect('index');
  }

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
          viewport.message = 'You have been registered. Please confirm your email address using the link in the email sent to your mailbox.';
          state.redirect('login');
        },
        function () {
          viewport.message = 'There was a problem registering you, probably this email address or display name is already in use.';
          $scope.registration.error.api = true;
        }
      );
    }
  };
});
