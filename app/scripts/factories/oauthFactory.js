'use strict';

CMAQ.factory('oauth', function ($q, $http, platformConfig, data, storage, state, helpers) {
  var oauth = {};
  var url = platformConfig.url + '/oauth2/';

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

    $http.post(url + 'token/', helpers.serialize(customData)).then(
      function (info) {
        info = info.data;

        info.expires_at = Math.floor(Date.now() / 1000) + info.expires_in;
        storage.put('OAUTH_KEY', JSON.stringify(info));

        oauth.authorize().finally(function () {
          state.redirect('redirect');
          deferred.resolve(info);
        });
      },
      function (error) {
        deferred.reject(error);
      }
    );

    return deferred.promise;
  };

  oauth.revoke = function () {
    var deferred = $q.defer();

    if (!_.isEmpty(data.authentication) && !_.isUndefined(data.authentication.access_token)) {
      var customData = {
        client_id: platformConfig.client,
        token: data.authentication.access_token
      };

      storage.remove('OAUTH_KEY');

      $http.post(url + 'revoke_token/', helpers.serialize(customData)).finally(function () {
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

      $http.post(url + 'token/', helpers.serialize(customData)).then(
        function (info) {
          info = info.data;

          info.expires_at = Math.floor(Date.now() / 1000) + info.expires_in;
          storage.put('OAUTH_KEY', JSON.stringify(info));

          oauth.authorize().finally(function () {
            deferred.resolve(info);
          });
        },
        function () {
          oauth.revoke().finally(function () {
            state.redirect('redirect');
          });
        }
      );
    } else {
      deferred.reject();
    }

    return deferred.promise;
  };

  oauth.authorize = function () {
    var deferred = $q.defer();
    var key = storage.get('OAUTH_KEY');

    if (!_.isEmpty(key)) {
      data.authentication = JSON.parse(key);
      $http.defaults.headers.common.Authorization = 'Bearer ' + data.authentication.access_token;

      deferred.resolve();
    } else {
      delete data.authentication;
      delete $http.defaults.headers.common.Authorization;

      deferred.reject();
    }

    return deferred.promise;
  };

  return oauth;
});
