'use strict';

AQ.controller('404Controller', function ($window, state) {
  $window.navigator.notification.alert(
    'The content you\'re trying to access is not found.',
    state.redirect,
    'Not found',
    'OK'
  );
});
