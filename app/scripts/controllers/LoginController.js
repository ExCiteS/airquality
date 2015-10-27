'use strict';

CMAQ.controller('LoginController', function ($scope, viewport, state, oauth, storage, helpers) {
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
      viewport.calling = true;

      oauth.authenticate(email, password).then(
        function () {
          storage.remove('POINTS');
          state.redirect();
        },
        function () {
          viewport.message = 'There was a problem logging you in, maybe your email or password is incorrect?';
          $scope.authentication.error.api = true;
        }
      ).finally(function () {
        viewport.calling = false;
      });
    }
  };
});
