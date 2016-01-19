/**
 * @ngdoc service
 * @name AQ.factory:api
 * @requires AQ.factory:data
 * @requires AQ.factory:viewport
 * @requires AQ.factory:state
 * @requires AQ.factory:storage
 * @requires AQ.factory:oauth
 *
 * @description
 * Factory provides API functionality.
 */
AQ.factory('api', function ($window, $interval, $q, $http, config, data, viewport, state, storage, oauth) {
  'use strict';

  var api = {};
  var url = config.url + '/api';

  var unsynced = {
    locations: []
  };

  /**
   * @ngdoc method
   * @name AQ.factory:api#online
   * @methodOf AQ.factory:api
   *
   * @description
   * Checks if user is online.
   *
   * @returns {Object} Promise
   */
  api.online = function () {
    var deferred = $q.defer();

    var interval = $interval(function () {
      if (viewport.online !== undefined) {
        $interval.cancel(interval);

        if (viewport.online) {
          deferred.resolve();
        } else {
          deferred.reject();
        }
      }

    }, 30);

    return deferred.promise;
  };

  /**
   * @ngdoc method
   * @name AQ.factory:api#sync
   * @methodOf AQ.factory:api
   *
   * @description
   * Syncs all unsynced data.
   *
   * @returns {Object} Promise
   */
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
            } else if (location.updated) {
              api.updateLocation(location).finally(function () {
                syncMeasurements(location, locationIndex, totalLocations);
              });
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

  /**
   * @ngdoc method
   * @name AQ.factory:api#sendSheet
   * @methodOf AQ.factory:api
   *
   * @description
   * Sends a CSV sheet.
   *
   * @returns {Object} Promise.
   */
  api.sendSheet = function () {
    var deferred = $q.defer();

    viewport.calling = true;

    api.sync().finally(function () {
      oauth.refresh().finally(function () {
        $http.get(url + '/airquality/sheet/').then(
          function () {
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

    return deferred.promise;
  };

  /**
   * @ngdoc method
   * @name AQ.factory:api#getUserInfo
   * @methodOf AQ.factory:api
   *
   * @description
   * Gets user info.
   *
   * @returns {Object} Promise with user info.
   */
  api.getUserInfo = function () {
    var deferred = $q.defer();

    viewport.calling = true;

    api.online().then(
      function () {
        api.sync().finally(function () {
          oauth.refresh().finally(function () {
            $http.get(url + '/user/').then(
              function (info) {
                deferred.resolve(info);
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
        viewport.calling = false;
        deferred.resolve({});
      }
    );

    return deferred.promise;
  };

  /**
   * @ngdoc method
   * @name AQ.factory:api#getLocations
   * @methodOf AQ.factory:api
   *
   * @description
   * Gets all locations.
   *
   * Successful response is saved inside the {@link AQ.factory:data#properties_locations `data` factory}.
   *
   * @returns {Object} Promise with locations.
   */
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
            $http.get(url + '/airquality/locations/').then(
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

  /**
   * @ngdoc method
   * @name AQ.factory:api#addLocation
   * @methodOf AQ.factory:api
   *
   * @description
   * Adds a new location.
   *
   * @param {Object} location New location to be added.
   * @returns {Object} Promise with location.
   */
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

            $http.post(url + '/airquality/locations/', location).then(
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

  /**
   * @ngdoc method
   * @name AQ.factory:api#updateLocation
   * @methodOf AQ.factory:api
   *
   * @description
   * Updates a location.
   *
   * @param {Object} location Current location to be updated.
   * @returns {Object} Promise with measurement.
   */
  api.updateLocation = function (location) {
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

            $http.patch(url + '/airquality/locations/' + location.id + '/', location).then(
              function (updatedLocation) {
                updatedLocation = updatedLocation.data;

                _.remove(data.locations, function (currentLocation) {
                  return currentLocation.id == location.id;
                });

                if (!_.isEmpty(updatedLocation) && updatedLocation.id) {
                  data.locations.push(updatedLocation);
                  data.location = updatedLocation;
                  deferred.resolve(updatedLocation);
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
        location.updated = true;
        viewport.calling = false;
        deferred.resolve(location);
      }
    );

    return deferred.promise;
  };

  /**
   * @ngdoc method
   * @name AQ.factory:api#deleteLocation
   * @methodOf AQ.factory:api
   *
   * @description
   * Deletes a location.
   *
   * @param {Number} locationId ID of a location.
   * @returns {Object} Promise.
   */
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
            $http.delete(url + '/airquality/locations/' + locationId + '/').then(
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

  /**
   * @ngdoc method
   * @name AQ.factory:api#startMeasurement
   * @methodOf AQ.factory:api
   *
   * @description
   * Starts a new measurement.
   *
   * @param {Object} measurement New measurement to be started.
   * @param {Number} locationId ID of a location.
   * @returns {Object} Promise with measurement.
   */
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

            $http.post(url + '/airquality/locations/' + locationId + '/measurements/', measurement).then(
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

  /**
   * @ngdoc method
   * @name AQ.factory:api#updateMeasurement
   * @methodOf AQ.factory:api
   *
   * @description
   * Updates a measurement.
   *
   * @param {Object} measurement Current measurement to be updated.
   * @param {Number} locationId ID of a location.
   * @returns {Object} Promise with measurement.
   */
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

            $http.patch(url + '/airquality/locations/' + locationId + '/measurements/' + measurement.id + '/', measurement).then(
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

  /**
   * @ngdoc method
   * @name AQ.factory:api#removeMeasurement
   * @methodOf AQ.factory:api
   *
   * @description
   * Removes a measurement.
   *
   * @param {Object} measurement Current measurement to be removed.
   * @param {Number} locationId ID of a location.
   * @returns {Object} Promise.
   */
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
            $http.delete(url + '/airquality/locations/' + locationId + '/measurements/' + measurementId + '/').then(
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

  /**
   * @ngdoc method
   * @name AQ.factory:api#getProjects
   * @methodOf AQ.factory:api
   *
   * @description
   * Gets all projects.
   *
   * Successful response is saved inside the {@link AQ.factory:data#properties_projects `data` factory}.
   *
   * @returns {Object} Promise with projects.
   */
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
