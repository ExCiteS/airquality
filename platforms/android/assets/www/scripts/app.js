'use strict';

var AQ = angular.module('AQ', [
  'templates',
  'ngSanitize',
  'ui.router',
  'angularMoment',
]);

AQ.config(function ($httpProvider, $urlRouterProvider, $stateProvider) {
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
    });
});

AQ.run(function ($window, $rootScope, config, viewport, data, state, oauth) {
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

'use strict';

AQ.controller('404Controller', function ($window, state) {
  $window.navigator.notification.alert(
    'The content you\'re trying to access is not found.',
    state.redirect,
    'Not found',
    'OK'
  );
});

'use strict';

AQ.controller('IndexController', function (state) {
  state.redirect('locations');
});

'use strict';

AQ.controller('LocationController', function ($timeout, $stateParams, $scope, data, viewport, state, storage, api, leaflet) {
  var locationId = $stateParams.locationId;

  state.setTitle('Location');
  $scope.formGroup = {
    measurements: {}
  };
  $scope.measurement = {
    error: {}
  };

  if (_.isEmpty(data.locations)) {
    api.getLocations().finally(function () {
      getLocation();
    });
  } else {
    getLocation();
  }

  function getLocation() {
    var location = _.find(data.locations, function (currentLocation) {
      return currentLocation.id == locationId;
    });

    if (location && !location.deleted) {
      var center, panning;

      leaflet.init(location);
      data.location = location;

      leaflet.map.on('movestart', function () {
        if (!panning) {
          center = leaflet.map.getCenter();
        } else {
          panning = false;
          center = undefined;
        }
      });

      leaflet.map.on('moveend', function () {
        if (center) {
          panning = true;
          leaflet.map.panTo(center);
        }
      });

      $timeout(function () {
        leaflet.map.invalidateSize();
      }, 10);

      _.each(location.measurements, function (measurement) {
        measurement.addResults = false;
      });
    } else {
      viewport.message = 'It looks like the location can\'t be found. Please choose an existing location from the list.';
      state.redirect('locations');
    }
  }

  $scope.delete = function () {
    api.deleteLocation(locationId).then(
      function () {
        viewport.message = 'The location has been deleted.';
      },
      function () {
        api.getLocations();
        viewport.message = 'An error occurred when trying to delete the location.';
      }
    ).finally(function () {
      state.redirect('locations');
    });
  };

  $scope.start = function () {
    $scope.measurement.error = {};

    _.each($scope.formGroup.form.$error.required, function (field) {
      field.$setDirty();
    });

    if (!$scope.formGroup.form.$error.required) {
      var data = {
        barcode: $scope.measurement.barcode.toString()
      };

      if (_.size(data.barcode) < 6) {
        data.barcode = new Array(6 - _.size(data.barcode) + 1).join('0') + data.barcode;
      }

      api.startMeasurement(data).then(
        function () {
          viewport.message = 'The measurement has started. You will receive an email in four weeks to notify you that you should collect the diffusion tube and finish the measurement.';
          $scope.measurement.barcode = undefined;
          $scope.formGroup.form.$setPristine();
          state.redirect('locations');
        },
        function () {
          viewport.message = 'An error occurred when trying to start the measurement. Please try again.';
          $scope.measurement.error.api = true;
        }
      );
    }
  };

  $scope.finish = function (measurement) {
    measurement.finish = true;

    api.updateMeasurement(measurement).then(
      function () {
        viewport.message = 'The measurement has finished. You can add the results when they come in to submit this measurement to Community Maps.';
      },
      function () {
        viewport.message = 'An error occurred when trying to finish the measurement. Please try again.';
        delete measurement.finished;
      }
    );
  };

  $scope.addResults = function (measurement) {
    api.getProjects().finally(function () {
      if (_.isEmpty(data.projects)) {
        viewport.message = 'It looks like there are no projects the measurement can be submitted to.';
      } else {
        measurement.error = {};
        delete measurement.results;
        delete measurement.project;
        var lastProjectUsed = storage.get('LAST_PROJECT_USED');

        if (lastProjectUsed) {
          measurement.project = JSON.parse(lastProjectUsed);
        } else {
          delete measurement.project;
        }

        $scope.formGroup.measurements[measurement.id].form.$setPristine();
        measurement.addResults = true;
      }
    });
  };

  $scope.submit = function (measurement) {
    measurement.error = {};

    _.each($scope.formGroup.measurements[measurement.id].form.$error.required, function (field) {
      field.$setDirty();
    });

    if (!$scope.formGroup.measurements[measurement.id].form.$error.required) {
      var lastProjectUsed = measurement.project;

      measurement.submit = true;
      measurement.addResults = false;

      api.updateMeasurement(measurement).then(
        function () {
          storage.put('LAST_PROJECT_USED', JSON.stringify(lastProjectUsed));
          viewport.message = 'The measurement has been submitted. Shortly it will be converted to a contribution, which can then be accessed using the Community Maps platform.';
        },
        function () {
          viewport.message = 'An error occurred when trying to submit the measurement. Please try again.';
          delete measurement.submitted;
        }
      );
    }
  };

  $scope.remove = function (measurement) {
    api.removeMeasurement(measurement.id).then(
      function () {
        viewport.message = 'The measurement has been removed.';
      },
      function () {
        viewport.message = 'An error occurred when trying to remove the measurement.';
      }
    );
  };
});

'use strict';

AQ.controller('LocationsAddController', function ($window, $scope, viewport, state, api, leaflet) {
  $scope.formGroup = {};
  $scope.location = {
    error: {}
  };

  if ('geolocation' in $window.navigator) {
    viewport.calling = true;

    $window.navigator.geolocation.getCurrentPosition(
      function (location) {
        $scope.$apply(function () {
          $scope.location.location = [location.coords.longitude, location.coords.latitude];

          leaflet.init({
          type: 'Point',
            coordinates: $scope.location.location
          });

          leaflet.map.on('moveend', function () {
            leaflet.marker.setLatLng(leaflet.map.getCenter());
          });

          viewport.calling = false;
        });
      },
      function (error) {
        $scope.$apply(function () {
          switch (error.code) {
            case 1:
              viewport.message = 'It seems like you\'re not allowing to use your current position. You can\'t add new locations without it, but you can still start new or finalise previous measurements.';
              break;

            case 2:
            case 3:
              viewport.message = 'There was an error trying to get your current position. You can\'t add new locations without it, but you can still start new or finalise previous measurements.';
              break;

            default:
              viewport.message = 'An unknown error occurred.';
          }

          viewport.calling = false;
          state.redirect('locations');
        });
      }
    );
  } else {
    viewport.message = 'It seems like your browser does not support geolocation. You can\'t add new locations, but you can still start new or finalise previous measurements.';
    state.redirect('locations');
  }

  $scope.add = function () {
    $scope.location.error = {};

    _.each($scope.formGroup.form.$error.required, function (field) {
      field.$setDirty();
    });

    if (!$scope.formGroup.form.$error.required) {
      var data = leaflet.marker.toGeoJSON();

      data.name = $scope.location.name;

      if (_.size(data.name) > 100) {
        data.name = data.name.substring(0, 97) + '...';
      }

      if ($scope.location.height) {
        data.properties.height = $scope.location.height;
      }

      if ($scope.location.distance) {
        data.properties.distance = $scope.location.distance;
      }

      if (!_.isEmpty($scope.location.characteristics)) {
        data.properties.characteristics = $scope.location.characteristics;
      }

      api.addLocation(data).then(
        function (location) {
          viewport.message = 'The location has been added. You can now start your measurements by adding a barcode.';
          state.goToLocation(location.id);
        },
        function () {
          viewport.message = 'An error occurred when trying to add the location. Please try again.';
          $scope.location.error.api = true;
        }
      );
    }
  };
});

'use strict';

AQ.controller('LocationsController', function (data, state, api) {
  state.setTitle('Locations');

  if (_.isEmpty(data.locations)) {
    api.getLocations();
  }
});

'use strict';

AQ.controller('LoginController', function ($window, $scope, viewport, state, oauth, storage, helpers) {
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
      oauth.authenticate(email, password).then(
        function () {
          state.redirect();
        },
        function () {
          $scope.authentication.error.api = true;

          $window.navigator.notification.alert(
            'There was a problem logging you in, maybe your email or password is incorrect?',
            undefined, // no callback
            'Error',
            'OK, I\'ll try again'
          );
        }
      );
    }
  };
});

'use strict';

AQ.controller('MainController', function ($window, $scope, data, viewport, state, storage, oauth, api) {
  $scope.data = data;
  $scope.viewport = viewport;
  $scope.state = state;

  // Watch data factory...
  $scope.$watch(
    function () {
      return data;
    },
    function (data) {
      viewport.unsynced = false;

      if (data.locations) {
        // ...and keep track of all unsynced data
        data.unsynced.locations = [];

        _.each(data.locations, function (location) {
          var locationAdded;

          if ((_.isString(location.id) && location.id.indexOf('x') > -1) || location.deleted) {
            viewport.unsynced = true;
            data.unsynced.locations.push(location);
            // Make sure location is added to the list of unsynced locations only once
            locationAdded = true;
          } else if (!_.isEmpty(location.measurements)) {
            _.each(location.measurements, function (measurement) {
              if ((_.isString(measurement.id) && measurement.id.indexOf('x') > -1) || measurement.deleted || measurement.updated) {
                // Add the whole location to the list of unsynced locations even only measurements are unsynced (this is sorted out later)
                if (!locationAdded) {
                  viewport.unsynced = true;
                  data.unsynced.locations.push(location);
                  locationAdded = true;
                }
              }
            });
          }
        });

        // ...also store locations locally
        storage.put('LOCATIONS', JSON.stringify(data.locations));
      }

      if (data.projects) {
        // ...and don't forget to store projects locally too
        storage.put('PROJECTS', JSON.stringify(data.projects));
      }
    }, true
  );

  $scope.sync = function () {
    api.sync();
  };

  $scope.logout = function () {
    var message = 'Are you sure you want to log out?';

    // Add additional message when unsynced data is present
    if (viewport.unsynced) {
      message += ' All unsynced data will be lost.';
    }

    $window.navigator.notification.confirm(
      message,
      function (buttonIndex) {
        // Log out when "Log me out" button is pressed
        if (buttonIndex === 1) {
          oauth.revoke().finally(function () {
            state.redirect('index');
          });
        }
      },
      'Log out?', ['Stay logged in', 'Log me out']
    );
  };
});

'use strict';

AQ.controller('RedirectController', function (state) {
  state.redirect();
});

'use strict';

AQ.controller('RegisterController', function ($window, $scope, data, viewport, state, oauth, helpers) {
  state.setTitle('Register');

  if (!_.isEmpty(data.authentication)) {
    state.redirect('index');
  }

  $scope.registration = {};

  $scope.register = function () {
    var email = $scope.registration.email;
    var displayName = $scope.registration.displayName;
    var password1 = $scope.registration.password1;
    var password2 = $scope.registration.password2;

    $scope.registration.error = {};

    if (!email || !_.isString(email) || !helpers.checkEmail(email)) {
      $scope.registration.error.email = true;
    }

    if (!displayName || !_.isString(displayName)) {
      $scope.registration.error.displayName = true;
    }

    if (!password1 || !_.isString(password1)) {
      $scope.registration.error.password1 = true;
    }

    if (!password2 || !_.isString(password2)) {
      $scope.registration.error.password2 = true;
    }

    if (!$scope.registration.error.password1 && !$scope.registration.error.password2) {
      if (password1.length < 6) {
        $scope.registration.error.passwordTooShort = true;
      } else if (password1 !== password2) {
        $scope.registration.error.passwordsDoNotMatch = true;
      }
    }

    if (_.isEmpty($scope.registration.error)) {
      oauth.register(email, displayName, password1, password2).then(
        function () {
          $window.navigator.notification.alert(
            'You have been registered. Please confirm your email address using the link in the email sent to your mailbox.',
            undefined,
            'Successfully registered',
            'OK, I\'ll do that'
          );

          state.redirect('login');
        },
        function () {
          $scope.registration.error.api = true;

          $window.navigator.notification.alert(
            'There was a n error registering you, probably this email address or display name is already in use.',
            undefined,
            'Error',
            'OK, I\'ll try again'
          );
        }
      );
    }
  };
});

'use strict';

AQ.factory('api', function ($window, $q, $http, config, data, viewport, storage, state, oauth) {
  var api = {};
  var url = config.url + '/api';

  var unsynced = {
    locations: []
  };

  api.online = function () {
    var deferred = $q.defer();

    if (viewport.online) {
      deferred.resolve();
    } else {
      deferred.reject();
    }

    deferred.resolve();
    return deferred.promise;
  };

  api.sync = function () {
    var deferred = $q.defer();
    var totalLocations = 0;

    function resolve(index, total) {
      if (index + 1 === total) {
        unsynced.locations = [];
        deferred.resolve();
      }
    }

    function syncMeasurements(location, locationIndex, totalLocations) {
      var total = 0;

      if (!_.isEmpty(location.measurements)) {
        total += location.measurements.length;

        _.each(location.measurements, function (measurement, index) {
          if (measurement.deleted) {
            api.removeMeasurement(measurement.id, location.id).finally(function () {
              if (index + 1 === total) {
                resolve(locationIndex, totalLocations);
              }
            });
          } else {
            if ((_.isString(measurement.id) && measurement.id.indexOf('x') > -1)) {
              api.startMeasurement(measurement, location.id).finally(function () {
                if (index + 1 === total) {
                  resolve(locationIndex, totalLocations);
                }
              });
            } else if (measurement.updated) {
              api.updateMeasurement(measurement, location.id).finally(function () {
                if (index + 1 === total) {
                  resolve(locationIndex, totalLocations);
                }
              });
            }
          }
        });
      } else {
        resolve(locationIndex, totalLocations);
      }
    }

    if (_.isEmpty(unsynced.locations)) {
      if (!_.isEmpty(data.unsynced.locations)) {
        unsynced.locations = _.cloneDeep(data.unsynced.locations);
        totalLocations += unsynced.locations.length;

        _.each(_.cloneDeep(unsynced.locations), function (location, locationIndex) {
          if (location.deleted) {
            api.deleteLocation(location.id).finally(function () {
              resolve(locationIndex, totalLocations);
            });
          } else {
            if ((_.isString(location.id) && location.id.indexOf('x') > -1)) {
              var measurements = _.cloneDeep(location.measurements);

              api.addLocation(location).then(
                function (addedLocation) {
                  location.id = addedLocation.id;
                  location.measurements = measurements;
                  syncMeasurements(location, locationIndex, totalLocations);
                },
                function () {
                  resolve(locationIndex, totalLocations);
                }
              );
            } else {
              syncMeasurements(location, locationIndex, totalLocations);
            }
          }
        });
      } else {
        deferred.resolve();
      }
    } else {
      deferred.resolve();
    }

    return deferred.promise;
  };

  api.getLocations = function () {
    var deferred = $q.defer();
    var locations = storage.get('LOCATIONS');

    viewport.calling = true;

    if (!_.isEmpty(locations)) {
      data.locations = JSON.parse(locations);
    }

    api.online().then(
      function () {
        api.sync().finally(function () {
          oauth.refresh().finally(function () {
            $http.get(url + '/airquality/points/').then(
              function (retrievedLocations) {
                data.locations = retrievedLocations.data;
                deferred.resolve(data.locations);
              },
              function (error) {
                data.locations = [];
                deferred.reject(error);
              }
            ).finally(function () {
              viewport.calling = false;
            });
          });
        });
      },
      function () {
        viewport.calling = false;
        deferred.resolve(data.locations);
      }
    );

    return deferred.promise;
  };

  api.addLocation = function (location) {
    var deferred = $q.defer();

    if (_.isUndefined(location)) {
      throw new Error('Location not specified');
    } else if (!_.isPlainObject(location)) {
      throw new Error('Location must be plain object');
    }

    var now = new Date();
    now = now.toISOString();

    viewport.calling = true;

    api.online().then(
      function () {
        api.sync().finally(function () {
          oauth.refresh().finally(function () {
            location.called = now;

            $http.post(url + '/airquality/points/', location).then(
              function (addedLocation) {
                addedLocation = addedLocation.data;

                _.remove(data.locations, function (currentLocation) {
                  return currentLocation.id == location.id;
                });

                location.id = addedLocation.id;
                location.created = addedLocation.created;
                location.geometry = addedLocation.geometry;
                location.measurements = addedLocation.measurements;

                data.locations.push(location);
                deferred.resolve(location);
              },
              function (error) {
                deferred.reject(error);
              }
            ).finally(function () {
              viewport.calling = false;
            });
          });
        });
      },
      function () {
        if (!_.isString(location.id) || location.id.indexOf('x') === -1) {
          var id = 'x';

          var newUnsyncedLocations = _.filter(data.unsynced.locations, function (location) {
            return _.isString(location.id) && location.id.indexOf('x') > -1;
          });

          if (!_.isEmpty(newUnsyncedLocations)) {
            id += parseInt(newUnsyncedLocations[newUnsyncedLocations.length - 1].id.replace('x', ''), 10) + 1;
          } else {
            id += 1;
          }

          location.id = id;
          location.created = now;
          location.measurements = [];
          data.locations.push(location);
        }

        viewport.calling = false;
        deferred.resolve(location);
      }
    );

    return deferred.promise;
  };

  api.deleteLocation = function (locationId) {
    var deferred = $q.defer();

    if (_.isUndefined(locationId)) {
      throw new Error('Location ID not specified');
    }

    viewport.calling = true;

    if (!_.isEmpty(data.location) && data.location.id == locationId) {
      delete data.location;
      state.redirect('locations');
    }

    api.online().then(
      function () {
        api.sync().finally(function () {
          oauth.refresh().finally(function () {
            $http.delete(url + '/airquality/points/' + locationId + '/').then(
              function () {
                _.remove(data.locations, function (currentLocation) {
                  return currentLocation.id == locationId;
                });

                deferred.resolve();
              },
              function (error) {
                deferred.reject(error);
              }
            ).finally(function () {
              viewport.calling = false;
            });
          });
        });
      },
      function () {
        var unsyncedLocation = _.find(data.unsynced.locations, function (currentLocation) {
          return currentLocation.id == locationId;
        });

        if (unsyncedLocation) {
          _.remove(data.locations, function (currentLocation) {
            return currentLocation.id == locationId;
          });
        } else {
          var location = _.find(data.locations, function (currentLocation) {
            return currentLocation.id == locationId;
          });

          location.deleted = true;
        }

        viewport.calling = false;
        deferred.resolve();
      }
    );

    return deferred.promise;
  };

  api.startMeasurement = function (measurement, locationId) {
    var deferred = $q.defer();

    if (_.isUndefined(measurement)) {
      throw new Error('Measurement not specified');
    } else if (!_.isPlainObject(measurement)) {
      throw new Error('Measurement must be plain object');
    } else if (_.isUndefined(locationId)) {
      if (_.isUndefined(data.location)) {
        throw new Error('Location not set');
      } else if (!_.isPlainObject(data.location)) {
        throw new Error('Location must be plain object');
      }

      locationId = data.location.id;
    }

    var now = new Date();
    now = now.toISOString();

    var location = _.find(data.locations, function (currentLocation) {
      return currentLocation.id == locationId;
    });

    viewport.calling = true;

    api.online().then(
      function () {
        api.sync().finally(function () {
          oauth.refresh().finally(function () {
            measurement.called = now;

            $http.post(url + '/airquality/points/' + locationId + '/measurements/', measurement).then(
              function (addedMeasurement) {
                addedMeasurement = addedMeasurement.data;

                _.remove(location.measurements, function (currentMeasurement) {
                  return currentMeasurement.id == measurement.id;
                });

                if (!_.isEmpty(addedMeasurement) && addedMeasurement.id) {
                  location.measurements.push(addedMeasurement);
                  deferred.resolve(addedMeasurement);
                } else {
                  deferred.resolve();
                }
              },
              function (error) {
                deferred.reject(error);
              }
            ).finally(function () {
              viewport.calling = false;
            });
          });
        });
      },
      function () {
        if (!_.isString(measurement.id) || measurement.id.indexOf('x') === -1) {
          var id = 'x';

          var newUnsyncedMeasurements = _.filter(location.measurements, function (currentMeasurement) {
            return _.isString(currentMeasurement.id) && currentMeasurement.id.indexOf('x') !== -1;
          });

          if (!_.isEmpty(newUnsyncedMeasurements)) {
            id += parseInt(newUnsyncedMeasurements[newUnsyncedMeasurements.length - 1].id.replace('x', ''), 10) + 1;
          } else {
            id += 1;
          }

          measurement.id = id;
          measurement.started = now;
          location.measurements.push(measurement);
        }

        viewport.calling = false;
        deferred.resolve(measurement);
      }
    );

    return deferred.promise;
  };

  api.updateMeasurement = function (measurement, locationId) {
    var deferred = $q.defer();

    if (_.isUndefined(measurement)) {
      throw new Error('Measurement not specified');
    } else if (!_.isPlainObject(measurement)) {
      throw new Error('Measurement must be plain object');
    } else if (_.isUndefined(locationId)) {
      if (_.isUndefined(data.location)) {
        throw new Error('Location not set');
      } else if (!_.isPlainObject(data.location)) {
        throw new Error('Location must be plain object');
      }

      locationId = data.location.id;
    }

    var now = new Date();
    now = now.toISOString();

    var location = _.find(data.locations, function (currentLocation) {
      return currentLocation.id == locationId;
    });

    viewport.calling = true;

    if (measurement.finish && !measurement.finished) {
      measurement.finished = now;
    }

    if (measurement.submit) {
      measurement.finish = false;

      if (!measurement.finished) {
        measurement.finished = now;
      }
    }

    api.online().then(
      function () {
        api.sync().finally(function () {
          oauth.refresh().finally(function () {
            measurement.called = now;

            $http.patch(url + '/airquality/points/' + locationId + '/measurements/' + measurement.id + '/', measurement).then(
              function (updatedMeasurement) {
                updatedMeasurement = updatedMeasurement.data;

                _.remove(location.measurements, function (currentMeasurement) {
                  return currentMeasurement.id == measurement.id;
                });

                if (!_.isEmpty(updatedMeasurement) && updatedMeasurement.id) {
                  location.measurements.push(updatedMeasurement);
                  deferred.resolve(updatedMeasurement);
                } else {
                  deferred.resolve();
                }
              },
              function (error) {
                deferred.reject(error);
              }
            ).finally(function () {
              viewport.calling = false;
            });
          });
        });
      },
      function () {
        measurement.updated = true;

        if (measurement.submit) {
          measurement.submitted = now;
        }

        viewport.calling = false;
        deferred.resolve(measurement);
      }
    );

    return deferred.promise;
  };

  api.removeMeasurement = function (measurementId, locationId) {
    var deferred = $q.defer();

    if (_.isUndefined(measurementId)) {
      throw new Error('Measurement ID not specified');
    } else if (_.isUndefined(locationId)) {
      if (_.isUndefined(data.location)) {
        throw new Error('Location not set');
      } else if (!_.isPlainObject(data.location)) {
        throw new Error('Location must be plain object');
      }

      locationId = data.location.id;
    }

    var location = _.find(data.locations, function (currentLocation) {
      return currentLocation.id == locationId;
    });

    viewport.calling = true;

    api.online().then(
      function () {
        api.sync().finally(function () {
          oauth.refresh().finally(function () {
            $http.delete(url + '/airquality/points/' + locationId + '/measurements/' + measurementId + '/').then(
              function () {
                _.remove(location.measurements, function (currentMeasurement) {
                  return currentMeasurement.id == measurementId;
                });

                deferred.resolve();
              },
              function (error) {
                deferred.reject(error);
              }
            ).finally(function () {
              viewport.calling = false;
            });
          });
        });
      },
      function () {
        if (_.isString(measurementId) && measurementId.indexOf('x') > -1) {
          _.remove(location.measurements, function (currentLocation) {
            return currentLocation.id == measurementId;
          });
        } else {
          var measurement = _.find(location.measurements, function (currentMeasurement) {
            return currentMeasurement.id == measurementId;
          });

          measurement.deleted = true;
        }

        viewport.calling = false;
        deferred.resolve();
      }
    );

    return deferred.promise;
  };

  api.getProjects = function () {
    var deferred = $q.defer();
    var projects = storage.get('PROJECTS');

    viewport.calling = true;

    data.projects = [];

    if (!_.isEmpty(projects)) {
      projects = JSON.parse(projects);
    } else {
      projects = undefined;
    }

    api.online().then(
      function () {
        api.sync().finally(function () {
          oauth.refresh().finally(function () {
            $http.get(url + '/airquality/projects/').then(
              function (retrievedProjects) {
                data.projects = retrievedProjects.data;
                deferred.resolve(data.projects);
              },
              function (error) {
                if (projects) {
                  data.projects = projects;
                }

                deferred.reject(error);
              }
            ).finally(function () {
              viewport.calling = false;
            });
          });
        });
      },
      function () {
        if (projects) {
          data.projects = projects;
        }

        viewport.calling = false;
        deferred.resolve(data.projects);
      }
    );

    return deferred.promise;
  };

  return api;
});

'use strict';

AQ.factory('data', function () {
  var data = {};

  data.authentication = {};
  data.locations = null;
  data.projects = null;

  data.unsynced = {
    locations: []
  };

  return data;
});

'use strict';

AQ.factory('helpers', function () {
  var helpers = {};

  helpers.serialize = function (object) {
    var params = [];

    if (_.isUndefined(object)) {
      throw new Error('Param not specified');
    } else if (!_.isPlainObject(object)) {
      throw new Error('Param must be plain object');
    }

    for (var key in object) {
      params.push(encodeURIComponent(key) + '=' + encodeURIComponent(object[key]));
    }

    return params.join('&');
  };

  helpers.checkEmail = function (email) {
    return /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i.test(email);
  };

  return helpers;
});

'use strict';

AQ.factory('leaflet', function () {
  var leaflet = {};

  leaflet.init = function (geoJson) {
    if (_.isUndefined(geoJson)) {
      throw new Error('GeoJSON not specified');
    } else if (!_.isPlainObject(geoJson)) {
      throw new Error('GeoJSON must be plain object');
    }

    leaflet.map = L.map('map').setView([51.5, -0.1], 10);
    leaflet.marker = undefined;

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
      attribution: '<a href="http://mapbox.com" target="blank">Mapbox</a>',
      minZoom: 3,
      maxZoom: 19,
      reuseTiles: true,
      id: 'empress.lci7b1km',
      accessToken: 'pk.eyJ1IjoiZW1wcmVzcyIsImEiOiJLRlp4aXN3In0.KS6UybthzK0BTRJhYVkBgg'
    }).addTo(leaflet.map);

    leaflet.data = L.geoJson(geoJson, {
      onEachFeature: function (feature, layer) {
        layer.setIcon(L.icon({
          iconUrl: 'images/marker.png',
          iconSize: [32, 37]
        }));

        leaflet.marker = layer;
      }
    }).addTo(leaflet.map);

    leaflet.marker.on('click', function () {
      leaflet.map.fitBounds(leaflet.data.getBounds());
    });
    leaflet.marker.fire('click');
  };

  return leaflet;
});

'use strict';

AQ.factory('oauth', function ($q, $http, config, data, viewport, state, storage, helpers) {
  var oauth = {};
  var url = config.url + '/oauth2/';

  oauth.register = function (email, displayName, password1, password2) {
    var deferred = $q.defer();

    if (_.isUndefined(email)) {
      throw new Error('Email not specified');
    } else if (!_.isString(email)) {
      throw new Error('Email must be a string');
    } else if (_.isUndefined(displayName)) {
      throw new Error('Display name not specified');
    } else if (!_.isString(displayName)) {
      throw new Error('Display name must be a string');
    } else if (_.isUndefined(password1)) {
      throw new Error('Password 1 not specified');
    } else if (!_.isString(password1)) {
      throw new Error('Password 1 must be a string');
    } else if (_.isUndefined(password2)) {
      throw new Error('Password 2 not specified');
    } else if (!_.isString(password2)) {
      throw new Error('Password 2 must be a string');
    } else if (password1 !== password2) {
      throw new Error('Passwords do not match');
    }

    var customData = {
      client_id: config.client,
      email: email,
      display_name: displayName,
      password1: password1,
      password2: password2
    };

    viewport.calling = true;

    $http.post(config.url + '/api/user/', customData).then(
      function () {
        deferred.resolve();
      },
      function (error) {
        deferred.reject(error);
      }
    ).finally(function () {
      viewport.calling = false;
    });

    return deferred.promise;
  };

  oauth.authenticate = function (email, password) {
    var deferred = $q.defer();

    if (_.isUndefined(email)) {
      throw new Error('Email not specified');
    } else if (!_.isString(email)) {
      throw new Error('Email must be a string');
    } else if (_.isUndefined(password)) {
      throw new Error('Password not specified');
    } else if (!_.isString(password)) {
      throw new Error('Password must be a string');
    }

    var customData = {
      grant_type: 'password',
      client_id: config.client,
      username: email,
      password: password
    };

    viewport.calling = true;

    $http({
      url: url + 'token/',
      method: 'POST',
      data: helpers.serialize(customData),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then(
      function (info) {
        info = info.data;

        info.expires_at = Math.floor(Date.now() / 1000) + info.expires_in;
        storage.put('AUTHENTICATION', JSON.stringify(info));

        oauth.authorize().finally(function () {
          deferred.resolve(info);
        });
      },
      function (error) {
        deferred.reject(error);
      }
    ).finally(function () {
      viewport.calling = false;
    });

    return deferred.promise;
  };

  oauth.revoke = function () {
    var deferred = $q.defer();

    if (!_.isEmpty(data.authentication) && !_.isUndefined(data.authentication.access_token)) {
      var customData = {
        client_id: config.client,
        token: data.authentication.access_token
      };

      storage.remove('AUTHENTICATION');

      viewport.calling = true;

      $http({
        url: url + 'revoke_token/',
        method: 'POST',
        data: helpers.serialize(customData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).finally(function () {
        viewport.calling = false;

        oauth.authorize().finally(function () {
          deferred.resolve();
        });
      });
    } else {
      deferred.reject();
    }

    return deferred.promise;
  };

  oauth.refresh = function () {
    var deferred = $q.defer();

    if (!_.isEmpty(data.authentication) && !_.isUndefined(data.authentication.refresh_token) && data.authentication.expires_at < Math.floor(Date.now() / 1000)) {
      var customData = {
        grant_type: 'refresh_token',
        client_id: config.client,
        refresh_token: data.authentication.refresh_token
      };

      viewport.calling = true;

      $http({
        url: url + 'token/',
        method: 'POST',
        data: helpers.serialize(customData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).then(
        function (info) {
          info = info.data;

          info.expires_at = Math.floor(Date.now() / 1000) + info.expires_in;
          storage.put('AUTHENTICATION', JSON.stringify(info));

          oauth.authorize().finally(function () {
            deferred.resolve(info);
          });
        },
        function () {
          oauth.revoke().finally(function () {
            state.redirect('redirect');
          });
        }
      ).finally(function () {
        viewport.calling = false;
      });
    } else {
      deferred.reject();
    }

    return deferred.promise;
  };

  oauth.authorize = function () {
    var deferred = $q.defer();
    var key = storage.get('AUTHENTICATION');

    if (!_.isEmpty(key)) {
      data.authentication = JSON.parse(key);
      $http.defaults.headers.common.Authorization = 'Bearer ' + data.authentication.access_token;

      deferred.resolve();
    } else {
      storage.remove('LOCATIONS');
      storage.remove('PROJECTS');
      storage.remove('LAST_PROJECT_USED');

      delete data.authentication;
      delete data.locations;

      delete $http.defaults.headers.common.Authorization;

      deferred.reject();
    }

    return deferred.promise;
  };

  return oauth;
});

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

  state.goToLocation = function (id) {
    if (_.isUndefined(id)) {
      throw new Error('Location ID not specified');
    }

    state.redirect('location', {
      locationId: id
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

'use strict';

AQ.factory('storage', function ($window) {
  var storage = {};

  storage.get = function (name) {
    if (_.isUndefined(name)) {
      throw new Error('Name must be set');
    }

    return $window.localStorage.getItem(name);
  };

  storage.put = function (name, value) {
    if (_.isUndefined(name)) {
      throw new Error('Name must be set');
    }

    $window.localStorage.setItem(name, value);
  };

  storage.remove = function (name) {
    if (_.isUndefined(name)) {
      throw new Error('Name must be set');
    }

    $window.localStorage.removeItem(name);
  };

  return storage;
});

'use strict';

AQ.factory('viewport', function () {
  var viewport = {};

  viewport.history = {};

  return viewport;
});

'use strict';

AQ.filter('active', function () {
  return function (locations) {
    var activeOnly = [];

    if (_.isArray(locations)) {
      _.each(locations, function (location) {
        // Do not include deleted locations
        if (!location.deleted) {
          activeOnly.push(location);
        }
      });
    }

    return activeOnly;
  };
});

'use strict';

AQ.filter('newline', function () {
  return function (input) {
    if (_.isString(input)) {
      input = input.replace(/\n/g, '<br />');
    }

    return input;
  };
});

'use strict';

AQ.constant('config', {
  // url: 'http://localhost:8000',
  url: 'http://play.geokey.org.uk',
  // client: '4OeUJl3rNDCnAcotvAu5fgM4SLA2iiKwtlD4Oj4m'
  client: 'l9BBDXcWJwi3Y9SDYDv9tbdlHkjRvMinQ1vFEVMh'
});
