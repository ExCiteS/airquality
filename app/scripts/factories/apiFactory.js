'use strict';

CMAQ.factory('api', function ($window, $q, $http, platformConfig, data, viewport, storage, oauth) {
  var api = {};
  var url = platformConfig.url + '/api';

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
    var total = 0;

    if (_.isEmpty(unsynced.points)) {
      if (!_.isEmpty(data.unsynced.points)) {
        unsynced.points = _.cloneDeep(data.unsynced.points);
        total += unsynced.points.length;

        _.each(_.cloneDeep(unsynced.points), function (point, index) {
          api.addPoint(point).finally(function () {
            _.remove(unsynced.points, function (currentPoint) {
              return currentPoint.id === point.id;
            });

            if (index + 1 === total) {
              deferred.resolve();
            }
          });
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
                data.points = retrievedPoints;
                storage.put('POINTS', JSON.stringify(data.points));

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

    viewport.calling = true;

    api.online().then(
      function () {
        api.sync().finally(function () {
          oauth.refresh().finally(function () {
            $http.post(url + '/airquality/points/', point).then(
              function (addedPoint) {
                _.remove(data.points, function (currentPoint) {
                  return currentPoint.id === point.id;
                });
                _.remove(data.unsynced.points, function (currentPoint) {
                  return currentPoint.id === point.id;
                });

                point.id = addedPoint.id;
                point.created = addedPoint.created;
                point.measurements = addedPoint.measurements;

                data.points.push(point);
                storage.put('POINTS', JSON.stringify(data.points));

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
        var now = new Date();

        if (!_.isString(point.id) || point.id.indexOf('x') === -1) {
          var id = 'x';

          if (!_.isEmpty(data.unsynced.points)) {
            id += parseInt(data.unsynced.points[data.unsynced.points.length - 1].id.replace('x', ''), 10) + 1;
          } else {
            id += 1;
          }

          point.id = id;
          point.created = now.toISOString();
          point.measurements = [];
          data.points.push(point);
          storage.put('POINTS', JSON.stringify(data.points));
        }

        viewport.calling = false;
        deferred.resolve(point);
      }
    );

    return deferred.promise;
  };

  api.getProjects = function () {
    var deferred = $q.defer();

    oauth.refresh().finally(function () {
      $http.get(url + '/airquality/projects/').then(
        function (projects) {
          projects = projects.data;

          data.projects = projects;

          deferred.resolve(projects);
        },
        function (error) {
          deferred.reject(error);
        }
      );
    });

    return deferred.promise;
  };

  return api;
});
