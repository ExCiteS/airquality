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
