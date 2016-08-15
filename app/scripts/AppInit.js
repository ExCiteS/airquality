/*jshint -W079 */

/***********************************************************
 * AIR QUALITY CORDOVA APPLICATION
 *
 * Developed by:
 * Julius Osokinas (j.osokinas@mappingforchange.org.uk)
 *
 * Copyright © 2015-2016 Mapping for Change
 **********************************************************/

/**
 * MAIN MODULE WITH INCLUDES
 */

var AQ = angular.module('AQ', [
  'templates',
  'ngSanitize',
  'ngTouch',
  'ngOpbeat',
  'ui.router',
  'angularMoment',
]);

/**
 * APP CONFIGURATION
 */

AQ.config(function (config, $httpProvider, $urlRouterProvider, $stateProvider, $opbeatProvider) {
  'use strict';

  $httpProvider.defaults.headers.post['Content-Type'] = 'application/json';
  $urlRouterProvider.when('', '/').otherwise('/404');

  // Get rid of trailing slash from the URL
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

  // Configure states
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
    .state('locations', {
      url: '/locations',
      views: {
        content: {
          controller: 'LocationsController',
          templateUrl: 'partials/locations.html'
        }
      }
    })
    .state('locations.add', {
      url: '/add',
      views: {
        subcontent: {
          controller: 'LocationsAddController',
          templateUrl: 'partials/locations-add.html'
        }
      }
    })
    .state('location', {
      url: '/location/:locationId',
      views: {
        content: {
          controller: 'LocationController',
          templateUrl: 'partials/location.html'
        }
      }
    })
    .state('location.edit', {
      url: '/edit',
      views: {
        subcontent: {
          controller: 'LocationEditController',
          templateUrl: 'partials/location-edit.html'
        }
      }
    });

  // Configure and install Opbeat
  if (config.opbeatOrgId && config.opbeatOrgId.length > 0 && config.opbeatAppId && config.opbeatAppId.length > 0) {
    $opbeatProvider.config({
      orgId: config.opbeatOrgId,
      appId: config.opbeatAppId
    });
  }
});

/**
 * APP RUNNER
 */

AQ.run(function ($window, $rootScope, config, viewport, data, state, oauth) {
  'use strict';

  oauth.authorize();

  // Always redirect to Login state when user is not authenticated (unless it is a state for logging in or registering)
  $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
    if (_.isEmpty(data.authentication) && ['register', 'login'].indexOf(toState.name) === -1) {
      event.preventDefault();
      state.redirect('login');
    }
  });

  // Save state history each time it changes
  $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
    state.saveHistory(toState.name, toParams, fromState.name, fromParams);
  });

  // Make viewport ready only when device is ready
  document.addEventListener('deviceready', function () {
    function exitApp() {
      $window.navigator.app.exitApp();
    }

    if (_.isEmpty(config)) {
      $window.navigator.notification.alert(
        'App configuration not set.',
        exitApp,
        'Error',
        'OK'
      );

      return;
    }

    if (!config.url) {
      $window.navigator.notification.alert(
        'Path to platform not set.',
        exitApp,
        'Error',
        'OK'
      );

      return;
    }

    config.url = config.url.replace(/\/$/, '');
    config.version = '@@version';
    viewport.platform = config.url;

    // Check if network connection is available on the run...
    if ($window.navigator.connection.type !== 'none') {
      $rootScope.$apply(function () {
        viewport.online = true;
        viewport.ready = true;
      });
    } else {
      $rootScope.$apply(function () {
        viewport.online = false;
        viewport.ready = true;
      });
    }

    // ...and while running the app
    document.addEventListener('online', function () {
      $rootScope.$apply(function () {
        viewport.online = true;
      });
    }, false);

    document.addEventListener('offline', function () {
      $rootScope.$apply(function () {
        viewport.online = false;
      });
    }, false);
  }, false);
});
