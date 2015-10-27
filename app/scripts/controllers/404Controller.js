'use strict';

CMAQ.controller('404Controller', function (viewport, state) {
  viewport.message = 'It looks like something went wrong. Shall we try again?';
  state.redirect();
});
