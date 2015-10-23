'use strict';

CMAQ.factory('api', function ($q, $http, platformConfig, data, oauth) {
  var api = {};
  var url = platformConfig.url + '/api';

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
  };

  return api;
});
