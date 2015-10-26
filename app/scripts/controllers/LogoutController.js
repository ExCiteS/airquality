'use strict';

CMAQ.controller('LogoutController', function ($scope, state, oauth) {
  state.setTitle('Log out');

  $scope.revoke = function () {
    oauth.revoke().finally(function () {
      state.redirect('index');
    });
  };
});
