'use strict';

AQ.factory('api', function ($window, $q, $http, config, data, viewport, storage, state, oauth) {
  var api = {};
  var url = config.url + '/api';

  var unsynced = {
    points: []
  };

  api.online = function () {
    var deferred = $q.defer();

    $http.get('//' + $window.location.hostname).then(
      function () {
        viewport.offline = false;
        deferred.resolve();
      },
      function () {
        viewport.offline = true;
        deferred.reject();
      }
    );

    return deferred.promise;
  };

  api.sync = function () {
    var deferred = $q.defer();
    var totalPoints = 0;

    function resolve(index, total) {
      if (index + 1 === total) {
        unsynced.points = [];
        deferred.resolve();
      }
    }

    function syncMeasurements(point, pointIndex, totalPoints) {
      var total = 0;

      if (!_.isEmpty(point.measurements)) {
        total += point.measurements.length;

        _.each(point.measurements, function (measurement, index) {
          if (measurement.deleted) {
            api.removeMeasurement(measurement.id, point.id).finally(function () {
              if (index + 1 === total) {
                resolve(pointIndex, totalPoints);
              }
            });
          } else {
            if ((_.isString(measurement.id) && measurement.id.indexOf('x') > -1)) {
              api.startMeasurement(measurement, point.id).finally(function () {
                if (index + 1 === total) {
                  resolve(pointIndex, totalPoints);
                }
              });
            } else if (measurement.updated) {
              resolve(pointIndex, totalPoints);
              api.updatedMeasurement(measurement, point.id).finally(function () {
                if (index + 1 === total) {
                  resolve(pointIndex, totalPoints);
                }
              });
            }
          }
        });
      } else {
        resolve(pointIndex, totalPoints);
      }
    }

    if (_.isEmpty(unsynced.points)) {
      if (!_.isEmpty(data.unsynced.points)) {
        unsynced.points = _.cloneDeep(data.unsynced.points);
        totalPoints += unsynced.points.length;

        _.each(_.cloneDeep(unsynced.points), function (point, pointIndex) {
          if (point.deleted) {
            api.deletePoint(point.id).finally(function () {
              resolve(pointIndex, totalPoints);
            });
          } else {
            if ((_.isString(point.id) && point.id.indexOf('x') > -1)) {
              api.addPoint(point).then(
                function (addedPoint) {
                  point.id = addedPoint.id;
                  syncMeasurements(point, pointIndex, totalPoints);
                },
                function () {
                  resolve(pointIndex, totalPoints);
                }
              );
            } else {
              syncMeasurements(point, pointIndex, totalPoints);
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

  api.getPoints = function () {
    var deferred = $q.defer();
    var points = storage.get('POINTS');

    viewport.calling = true;

    data.points = [];

    if (!_.isEmpty(points)) {
      points = JSON.parse(points);
    } else {
      points = undefined;
    }

    api.online().then(
      function () {
        api.sync().finally(function () {
          oauth.refresh().finally(function () {
            $http.get(url + '/airquality/points/').then(
              function (retrievedPoints) {
                data.points = retrievedPoints.data;
                deferred.resolve(data.points);
              },
              function (error) {
                if (points) {
                  data.points = points;
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
        if (points) {
          data.points = points;
        }

        viewport.calling = false;
        deferred.resolve(data.points);
      }
    );

    return deferred.promise;
  };

  api.addPoint = function (point) {
    var deferred = $q.defer();

    if (_.isUndefined(point)) {
      throw new Error('Point not specified');
    } else if (!_.isPlainObject(point)) {
      throw new Error('Point must be plain object');
    }

    var now = new Date();
    now = now.toISOString();

    viewport.calling = true;

    api.online().then(
      function () {
        api.sync().finally(function () {
          oauth.refresh().finally(function () {
            point.called = now;

            $http.post(url + '/airquality/points/', point).then(
              function (addedPoint) {
                addedPoint = addedPoint.data;

                _.remove(data.points, function (currentPoint) {
                  return currentPoint.id == point.id;
                });

                point.id = addedPoint.id;
                point.created = addedPoint.created;
                point.geometry = addedPoint.geometry;
                point.measurements = addedPoint.measurements;

                data.points.push(point);
                deferred.resolve(point);
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
        if (!_.isString(point.id) || point.id.indexOf('x') === -1) {
          var id = 'x';

          if (!_.isEmpty(data.unsynced.points)) {
            id += parseInt(data.unsynced.points[data.unsynced.points.length - 1].id.replace('x', ''), 10) + 1;
          } else {
            id += 1;
          }

          point.id = id;
          point.created = now;
          point.measurements = [];
          data.points.push(point);
        }

        viewport.calling = false;
        deferred.resolve(point);
      }
    );

    return deferred.promise;
  };

  api.deletePoint = function (pointId) {
    var deferred = $q.defer();

    if (_.isUndefined(pointId)) {
      throw new Error('Point ID not specified');
    }

    viewport.calling = true;

    if (!_.isEmpty(data.point) && data.point.id == pointId) {
      delete data.point;
      state.redirect('points');
    }

    api.online().then(
      function () {
        api.sync().finally(function () {
          oauth.refresh().finally(function () {
            $http.delete(url + '/airquality/points/' + pointId + '/').then(
              function () {
                _.remove(data.points, function (currentPoint) {
                  return currentPoint.id == pointId;
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
        var unsyncedPoint = _.find(data.unsynced.points, function (currentPoint) {
          return currentPoint.id == pointId;
        });

        if (unsyncedPoint) {
          _.remove(data.points, function (currentPoint) {
            return currentPoint.id == pointId;
          });
        } else {
          var point = _.find(data.points, function (currentPoint) {
            return currentPoint.id == pointId;
          });

          point.deleted = true;
        }

        viewport.calling = false;
        deferred.resolve();
      }
    );

    return deferred.promise;
  };

  api.startMeasurement = function (measurement, pointId) {
    var deferred = $q.defer();

    if (_.isUndefined(measurement)) {
      throw new Error('Measurement not specified');
    } else if (!_.isPlainObject(measurement)) {
      throw new Error('Measurement must be plain object');
    } else if (_.isUndefined(pointId)) {
      if (_.isUndefined(data.point)) {
        throw new Error('Point not set');
      } else if (!_.isPlainObject(data.point)) {
        throw new Error('Point must be plain object');
      }

      pointId = data.point.id;
    }

    var now = new Date();
    now = now.toISOString();

    var point = _.find(data.points, function (currentPoint) {
      return currentPoint.id == pointId;
    });

    viewport.calling = true;

    api.online().then(
      function () {
        api.sync().finally(function () {
          oauth.refresh().finally(function () {
            measurement.called = now;

            $http.post(url + '/airquality/points/' + pointId + '/measurements/', measurement).then(
              function (addedMeasurement) {
                addedMeasurement = addedMeasurement.data;

                _.remove(point.measurements, function (currentMeasurement) {
                  return currentMeasurement.id == measurement.id;
                });

                measurement.id = addedMeasurement.id;
                measurement.created = addedMeasurement.created;

                point.measurements.push(measurement);
                deferred.resolve(measurement);
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

          var newUnsyncedMeasurements = _.filter(point.measurements, function (currentMeasurement) {
            return _.isString(currentMeasurement.id) && currentMeasurement.id.indexOf('x') !== -1;
          });

          if (!_.isEmpty(newUnsyncedMeasurements)) {
            id += parseInt(newUnsyncedMeasurements[newUnsyncedMeasurements.length - 1].id.replace('x', ''), 10) + 1;
          } else {
            id += 1;
          }

          measurement.id = id;
          measurement.started = now;
          point.measurements.push(measurement);
        }

        viewport.calling = false;
        deferred.resolve(measurement);
      }
    );

    return deferred.promise;
  };

  api.updateMeasurement = function (measurement, pointId) {
    var deferred = $q.defer();

    if (_.isUndefined(measurement)) {
      throw new Error('Measurement not specified');
    } else if (!_.isPlainObject(measurement)) {
      throw new Error('Measurement must be plain object');
    } else if (_.isUndefined(pointId)) {
      if (_.isUndefined(data.point)) {
        throw new Error('Point not set');
      } else if (!_.isPlainObject(data.point)) {
        throw new Error('Point must be plain object');
      }

      pointId = data.point.id;
    }

    var now = new Date();
    now = now.toISOString();

    var point = _.find(data.points, function (currentPoint) {
      return currentPoint.id == pointId;
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

            $http.patch(url + '/airquality/points/' + pointId + '/measurements/' + measurement.id, measurement).then(
              function (updatedMeasurement) {
                updatedMeasurement = updatedMeasurement.data;

                _.remove(point.measurements, function (currentMeasurement) {
                  return currentMeasurement.id == measurement.id;
                });

                if (!measurement.submit) {
                  point.measurements.push(updatedMeasurement);
                }

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

  api.removeMeasurement = function (measurementId, pointId) {
    var deferred = $q.defer();

    if (_.isUndefined(measurementId)) {
      throw new Error('Measurement ID not specified');
    } else if (_.isUndefined(pointId)) {
      if (_.isUndefined(data.point)) {
        throw new Error('Point not set');
      } else if (!_.isPlainObject(data.point)) {
        throw new Error('Point must be plain object');
      }

      pointId = data.point.id;
    }

    var point = _.find(data.points, function (currentPoint) {
      return currentPoint.id == pointId;
    });

    viewport.calling = true;

    api.online().then(
      function () {
        api.sync().finally(function () {
          oauth.refresh().finally(function () {
            $http.delete(url + '/airquality/points/' + pointId + '/measurements/' + measurementId + '/').then(
              function () {
                _.remove(point.measurements, function (currentMeasurement) {
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
          _.remove(point.measurements, function (currentPoint) {
            return currentPoint.id == measurementId;
          });
        } else {
          var measurement = _.find(point.measurements, function (currentMeasurement) {
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
