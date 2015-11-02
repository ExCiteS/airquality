/*jshint -W079 */

'use strict';

var AQ = angular.module('AQ', [
  'templates',
  'ngSanitize',
  'ui.router',
  'angularMoment',
]);

AQ.config(function ($httpProvider, $urlRouterProvider, $stateProvider, config) {
  if (_.isEmpty(config)) {
    throw new Error('Configuration not set');
  } else if (!config.url) {
    throw new Error('Path to platform not set');
  }

  config.version = '@@version';
  config.url = config.url.replace(/\/$/, '');

  $httpProvider.defaults.headers.post['Content-Type'] = 'application/json';
  $urlRouterProvider.when('', '/').otherwise('/404');

  $urlRouterProvider.rule(function ($injector, $location) {
    var path = $location.url();

    if ('/' === path[path.length - 1]) {
      return path.replace(/\/$/, '');
    }

    if (path.indexOf('/?') > 0) {
      return path.replace('/?', '?');
    }

    return false;
  });

  $stateProvider
    .state('index', {
      url: '/',
      views: {
        content: {
          controller: 'IndexController'
        }
      }
    })
    .state('404', {
      url: '/404',
      views: {
        content: {
          controller: '404Controller'
        }
      }
    })
    .state('redirect', {
      url: '/redirect',
      views: {
        content: {
          controller: 'RedirectController'
        }
      }
    })
    .state('register', {
      url: '/register',
      views: {
        content: {
          controller: 'RegisterController',
          templateUrl: 'partials/register.html'
        }
      }
    })
    .state('login', {
      url: '/login',
      views: {
        content: {
          controller: 'LoginController',
          templateUrl: 'partials/login.html'
        }
      }
    })
    .state('logout', {
      url: '/logout',
      views: {
        content: {
          controller: 'LogoutController',
          templateUrl: 'partials/logout.html'
        }
      }
    })
    .state('points', {
      url: '/points',
      views: {
        content: {
          controller: 'PointsController',
          templateUrl: 'partials/points.html'
        }
      }
    })
    .state('points.add', {
      url: '/add',
      views: {
        subcontent: {
          controller: 'PointsAddController',
          templateUrl: 'partials/points-add.html'
        }
      }
    })
    .state('point', {
      url: '/point/:pointId',
      views: {
        content: {
          controller: 'PointController',
          templateUrl: 'partials/point.html'
        }
      }
    });
});

AQ.run(function ($window, $rootScope, config, viewport, data, state, oauth, api) {
  oauth.authorize();
  api.online();

  viewport.platform = config.url;
  viewport.ready = true;

  $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
    if (_.isEmpty(data.authentication) && ['register', 'login'].indexOf(toState.name) === -1) {
      event.preventDefault();
      state.redirect('login');
    }
  });

  $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
    state.saveHistory(toState.name, toParams, fromState.name, fromParams);
  });
});
