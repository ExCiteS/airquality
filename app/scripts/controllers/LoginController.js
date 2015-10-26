'use strict';

CMAQ.controller('LoginController', function ($scope, state, oauth, helpers) {
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
      $scope.authentication.calling = true;

      oauth.authenticate(email, password).then(
        function () {
          state.redirect();
        },
        function () {
          $scope.authentication.calling = false;
          $scope.authentication.error.api = true;
        }
      );
    }
  };
});
