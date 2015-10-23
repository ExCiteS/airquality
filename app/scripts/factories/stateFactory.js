'use strict';

CMAQ.factory('state', function ($state) {
  var state = {};

  state.history = {};

  state.redirect = function (state, params) {
    if (state) {
      $state.transitionTo(state, params);
    } else if (!_.isEmpty(state.history) && state.history.previousState) {
      $state.transitionTo(state.history.previousState, state.history.previousParams);
    } else {
      $state.transitionTo('index');
    }
  };

  state.saveHistory = function (currentState, currentParams) {
    if (_.isUndefined(currentState)) {
      throw new Error('Current state not specified');
    } else if (!_.isString(currentState)) {
      throw new Error('Current state must be a string');
    }

    if (state.history.currentState && (['404', 'redirect', 'logout'].indexOf(state.history.currentState) === -1)) {
      state.history.previousState = state.history.currentState;

      if (!_.isEmpty(state.history.currentParams)) {
        state.history.previousParams = _.clone(state.history.currentParams);
      } else {
        delete state.history.previousParams;
      }
    } else {
      delete state.history.previousState;
      delete state.history.previousParams;
    }

    state.history.currentState = currentState;

    if (!_.isEmpty(currentParams)) {
      state.history.currentParams = currentParams;
    } else {
      delete state.history.currentParams;
    }
  };

  return state;
});
