'use strict';

AQ.factory('state', function ($window, $state, data, viewport) {
  var state = {};

  state.redirect = function (state, params) {
    if (state) {
      $state.transitionTo(state, params);
    } else if (!_.isEmpty(viewport.history) && viewport.history.previousState) {
      $state.transitionTo(viewport.history.previousState, viewport.history.previousParams);
    } else {
      $state.transitionTo('index');
    }
  };

  state.goToPoint = function (id) {
    if (_.isUndefined(id)) {
      throw new Error('Point ID not specified');
    }

    state.redirect('point', {
      pointId: id
    });
  };

  state.goToExternalPage = function (url) {
    if (_.isUndefined(url)) {
      throw new Error('URL not specified');
    } else if (!_.isString(url)) {
      throw new Error('URL must be a string');
    }

    $window.open(url);
  };

  state.saveHistory = function (currentState, currentParams) {
    if (_.isUndefined(currentState)) {
      throw new Error('Current state not specified');
    } else if (!_.isString(currentState)) {
      throw new Error('Current state must be a string');
    }

    if (viewport.history.currentState && (['404', 'redirect', 'logout'].indexOf(viewport.history.currentState) === -1)) {
      viewport.history.previousState = viewport.history.currentState;

      if (!_.isEmpty(viewport.history.currentParams)) {
        viewport.history.previousParams = _.clone(viewport.history.currentParams);
      } else {
        delete viewport.history.previousParams;
      }
    } else {
      delete viewport.history.previousState;
      delete viewport.history.previousParams;
    }

    viewport.history.currentState = currentState;

    if (!_.isEmpty(currentParams)) {
      viewport.history.currentParams = currentParams;
    } else {
      delete viewport.history.currentParams;
    }
  };

  state.setTitle = function (title, subtitle) {
    var mainTitle = 'Community Maps Air Quality';

    if (_.isEmpty(title)) {
      viewport.title = mainTitle;
    } else {
      title += subtitle ? ': ' + subtitle : '';
      title += ' | ' + mainTitle;

      viewport.title = title;
    }
  };

  return state;
});
