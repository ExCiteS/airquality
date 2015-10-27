'use strict';

CMAQ.factory('oauth', function ($q, $http, platformConfig, data, viewport, state, storage, helpers) {
  var oauth = {};
  var url = platformConfig.url + '/oauth2/';

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
      client_id: platformConfig.client,
      email: email,
      display_name: displayName,
      password1: password1,
      password2: password2
    };

    viewport.calling = true;

    $http.post(platformConfig.url + '/api/user/', customData).then(
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
      client_id: platformConfig.client,
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
        client_id: platformConfig.client,
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
        client_id: platformConfig.client,
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
      storage.remove('POINTS');

      delete data.authentication;
      delete data.points;

      delete $http.defaults.headers.common.Authorization;

      deferred.reject();
    }

    return deferred.promise;
  };

  return oauth;
});
