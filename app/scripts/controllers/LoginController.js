'use strict';

AQ.controller('LoginController', function ($window, $scope, viewport, state, oauth, storage, helpers) {
  state.setTitle('Log in');
  $scope.authentication = {};

  $scope.authenticate = function () {
    var email = $scope.authentication.email;
    var password = $scope.authentication.password;

    $scope.authentication.error = {};

    if (!email || !_.isString(email) || !helpers.checkEmail(email)) {
      $scope.authentication.error.email = true;
    }

    if (!password || !_.isString(password)) {
      $scope.authentication.error.password = true;
    }

    if (_.isEmpty($scope.authentication.error)) {
      oauth.authenticate(email, password).then(
        function () {
          state.redirect();
        },
        function () {
          $scope.authentication.error.api = true;

          $window.navigator.notification.alert(
            'There was a problem logging you in, maybe your email or password is incorrect?',
            undefined,
            'Error',
            'OK, I\'ll try again'
          );
        }
      );
    }
  };
});
