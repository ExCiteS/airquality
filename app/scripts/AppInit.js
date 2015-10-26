/*jshint -W079 */

'use strict';

var CMAQ = angular.module('CMAQ', [
  'templates',
  'ui.router'
]);

CMAQ.config(function ($httpProvider, $urlRouterProvider, $stateProvider, appConfig, platformConfig) {
  if (_.isEmpty(appConfig)) {
    throw new Error('App configuration not set');
  } else if (!appConfig.title) {
    throw new Error('App title not set');
  } else if (_.isEmpty(platformConfig)) {
    throw new Error('Platform configuration not set');
  } else if (!platformConfig.url) {
    throw new Error('Path to platform not set');
  }

  appConfig.version = '@@version';
  platformConfig.url = platformConfig.url.replace(/\/$/, '');

  $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
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
      controller: 'IndexController'
    })
    .state('404', {
      url: '/404',
      controller: '404Controller'
    })
    .state('redirect', {
      url: '/redirect',
      controller: 'RedirectController'
    })
    .state('login', {
      url: '/login',
      views: {
        content: {
          controller: 'LoginController',
          templateUrl: 'partials/login.html'
        }
      }
    });
});

CMAQ.run(function ($window, $rootScope, appConfig, viewport, state, oauth) {
  viewport.version = appConfig.version;

  if (appConfig.ga && _.isFunction($window.ga)) {
    $window.ga('create', appConfig.ga, 'auto');
  }

  oauth.authorize();
  viewport.ready = true;

  $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
    state.saveHistory(toState.name, toParams, fromState.name, fromParams);
  });
});
