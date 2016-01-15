'use strict';

/**
 * @ngdoc service
 * @name AQ.factory:state
 * @requires AQ.factory:data
 * @requires AQ.factory:viewport
 *
 * @description
 * Provides state functionality.
 */
AQ.factory('state', function ($window, $state, data, viewport) {
  var state = {};

  /**
   * @ngdoc method
   * @name AQ.factory:state#redirect
   * @methodOf AQ.factory:state
   *
   * @description
   * Redirects to a specific state (with optional params). If no state is provided, it redirects to the previous state.
   * If previous state is not set, then it redirects to the Index state by default.
   *
   * @param {String} [state] State to which navigate to.
   * @param {Object} [params] Params of that state.
   */
  state.redirect = function (state, params) {
    if (state) {
      $state.transitionTo(state, params);
    } else if (!_.isEmpty(viewport.history) && viewport.history.previousState) {
      $state.transitionTo(viewport.history.previousState, viewport.history.previousParams);
    } else {
      $state.transitionTo('index');
    }
  };

  /**
   * @ngdoc method
   * @name AQ.factory:state#goToLocation
   * @methodOf AQ.factory:state
   *
   * @description
   * Goes to Location state.
   *
   * @param {Number} id Location ID.
   */
  state.goToLocation = function (id) {
    if (_.isUndefined(id)) {
      throw new Error('Location ID not specified');
    }

    state.redirect('location', {
      locationId: id
    });
  };

  /**
   * @ngdoc method
   * @name AQ.factory:state#editLocation
   * @methodOf AQ.factory:state
   *
   * @description
   * Goes to LocationEdit state.
   *
   * @param {Number} id Location ID.
   */
  state.editLocation = function (id) {
    if (_.isUndefined(id)) {
      throw new Error('Location ID not specified');
    }

    state.redirect('location.edit', {
      locationId: id
    });
  };

  /**
   * @ngdoc method
   * @name AQ.factory:state#goToExternalPage
   * @methodOf AQ.factory:state
   *
   * @description
   * Goes to external page.
   *
   * @param {String} url External URL to go to.
   */
  state.goToExternalPage = function (url) {
    if (_.isUndefined(url)) {
      throw new Error('URL not specified');
    } else if (!_.isString(url)) {
      throw new Error('URL must be a string');
    }

    $window.open(url);
  };

  /**
   * @ngdoc method
   * @name AQ.factory:state#saveHistory
   * @methodOf AQ.factory:state
   *
   * @description
   * Saves state history (current state with params, previous state with params). It excludes 404 and Redirect states
   * from previous state entry.
   *
   * @param {String} currentState Current state name.
   * @param {Object} [currentParams] Params of a current state.
   */
  state.saveHistory = function (currentState, currentParams) {
    if (_.isUndefined(currentState)) {
      throw new Error('Current state not specified');
    } else if (!_.isString(currentState)) {
      throw new Error('Current state must be a string');
    }

    if (viewport.history.currentState && (['404', 'redirect'].indexOf(viewport.history.currentState) === -1)) {
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

  /**
   * @ngdoc method
   * @name AQ.factory:state#setTitle
   * @methodOf AQ.factory:state
   *
   * @description
   * Sets the title of the app, including an optional subtitle.
   *
   * @param {String} [title] Main title of the app.
   * @param {String} [subtitle] Subtitle set before the title.
   */
  state.setTitle = function (title, subtitle) {
    var mainTitle = 'Air Quality';

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
