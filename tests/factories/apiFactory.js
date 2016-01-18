describe('Factory: api', function () {
  'use strict';

  var q, httpBackend;
  var apiFactory, dataFactory, viewportFactory, oauthFactory;
  var store = {},
    callbacks;

  beforeEach(function () {
    module('AQ');

    // Exclude Firefox
    if (navigator.userAgent.indexOf('Firefox') == -1) {
      spyOn(localStorage, 'getItem').and.callFake(function (key) {
        return store[key];
      });

      spyOn(localStorage, 'setItem').and.callFake(function (key, value) {
        store[key] = value;
      });

      spyOn(localStorage, 'removeItem').and.callFake(function (key) {
        delete store[key];
      });
    }

    callbacks = function () {};
  });

  beforeEach(inject(function ($q, $httpBackend, api, data, viewport, oauth) {
    q = $q;
    httpBackend = $httpBackend;
    apiFactory = api;
    dataFactory = data;
    viewportFactory = viewport;
    oauthFactory = oauth;
  }));

  afterEach(function () {
    store = {};
  });

  describe('Public method: online', function () {
    it('should reject when offline', function () {
      viewportFactory.online = false;

      callbacks.successCallback = function () {
        expect(callbacks.successCallback).not.toHaveBeenCalled();
      };
      callbacks.errorCallback = function () {
        expect(callbacks.errorCallback).toHaveBeenCalled();
      };

      spyOn(callbacks, 'successCallback').and.callThrough();
      spyOn(callbacks, 'errorCallback').and.callThrough();

      apiFactory.online()
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);
    });

    it('should resolve when online', function () {
      viewportFactory.online = true;

      callbacks.successCallback = function () {
        expect(callbacks.successCallback).toHaveBeenCalled();
      };
      callbacks.errorCallback = function () {
        expect(callbacks.errorCallback).not.toHaveBeenCalled();
      };

      spyOn(callbacks, 'successCallback').and.callThrough();
      spyOn(callbacks, 'errorCallback').and.callThrough();

      apiFactory.online()
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);
    });
  });

  describe('Public method: sendSheet', function () {
    beforeEach(function () {
      var deferred = q.defer();

      spyOn(apiFactory, 'sync').and.callFake(function () {
        deferred.resolve();
        return deferred.promise;
      });
      spyOn(oauthFactory, 'refresh').and.callFake(function () {
        deferred.resolve();
        return deferred.promise;
      });
    });

    it('should reject on error', function () {
      callbacks.successCallback = function () {
        expect(callbacks.successCallback).not.toHaveBeenCalled();
      };
      callbacks.errorCallback = function () {
        expect(callbacks.errorCallback).toHaveBeenCalled();
      };

      spyOn(callbacks, 'successCallback').and.callThrough();
      spyOn(callbacks, 'errorCallback').and.callThrough();

      apiFactory.sendSheet()
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      httpBackend.when('GET', /\.*airquality\/sheet.*/).respond(500);
      httpBackend.flush();
    });

    it('should resolve on success', function () {
      callbacks.successCallback = function () {
        expect(callbacks.successCallback).toHaveBeenCalled();
      };
      callbacks.errorCallback = function () {
        expect(callbacks.errorCallback).not.toHaveBeenCalled();
      };

      spyOn(callbacks, 'successCallback').and.callThrough();
      spyOn(callbacks, 'errorCallback').and.callThrough();

      apiFactory.sendSheet()
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      httpBackend.when('GET', /\.*airquality\/sheet.*/).respond(201);
      httpBackend.flush();
    });
  });

  describe('Public method: getUserInfo', function () {
    beforeEach(function () {
      var deferred = q.defer();

      spyOn(apiFactory, 'sync').and.callFake(function () {
        deferred.resolve();
        return deferred.promise;
      });
      spyOn(oauthFactory, 'refresh').and.callFake(function () {
        deferred.resolve();
        return deferred.promise;
      });
    });

    it('should resolve when offline', function () {
      var deferred = q.defer();

      spyOn(apiFactory, 'online').and.callFake(function () {
        deferred.reject();
        return deferred.promise;
      });

      callbacks.successCallback = function () {
        expect(callbacks.successCallback).toHaveBeenCalled();
      };
      callbacks.errorCallback = function () {
        expect(callbacks.errorCallback).not.toHaveBeenCalled();
      };

      spyOn(callbacks, 'successCallback').and.callThrough();
      spyOn(callbacks, 'errorCallback').and.callThrough();

      apiFactory.getUserInfo()
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);
    });

    it('should reject on error', function () {
      var deferred = q.defer();

      spyOn(apiFactory, 'online').and.callFake(function () {
        deferred.resolve();
        return deferred.promise;
      });

      callbacks.successCallback = function () {
        expect(callbacks.successCallback).not.toHaveBeenCalled();
      };
      callbacks.errorCallback = function () {
        expect(callbacks.errorCallback).toHaveBeenCalled();
      };

      spyOn(callbacks, 'successCallback').and.callThrough();
      spyOn(callbacks, 'errorCallback').and.callThrough();

      apiFactory.getUserInfo()
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      httpBackend.when('GET', /\.*user.*/).respond(500);
      httpBackend.flush();
    });

    it('should resolve on success', function () {
      var deferred = q.defer();

      spyOn(apiFactory, 'online').and.callFake(function () {
        deferred.resolve();
        return deferred.promise;
      });

      callbacks.successCallback = function () {
        expect(callbacks.successCallback).toHaveBeenCalled();
      };
      callbacks.errorCallback = function () {
        expect(callbacks.errorCallback).not.toHaveBeenCalled();
      };

      spyOn(callbacks, 'successCallback').and.callThrough();
      spyOn(callbacks, 'errorCallback').and.callThrough();

      apiFactory.getUserInfo()
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      httpBackend.when('GET', /\.*user.*/).respond(200, {});
      httpBackend.flush();
    });
  });

  // Exclude Firefox
  if (navigator.userAgent.indexOf('Firefox') == -1) {
    describe('Public method: getLocations', function () {
      beforeEach(function () {
        var deferred = q.defer();

        spyOn(apiFactory, 'sync').and.callFake(function () {
          deferred.resolve();
          return deferred.promise;
        });
        spyOn(oauthFactory, 'refresh').and.callFake(function () {
          deferred.resolve();
          return deferred.promise;
        });
      });

      it('should resolve when offline and there are no locations in storage', function () {
        var deferred = q.defer();

        store.LOCATIONS = undefined;

        spyOn(apiFactory, 'online').and.callFake(function () {
          deferred.reject();
          return deferred.promise;
        });

        callbacks.successCallback = function () {
          expect(callbacks.successCallback).toHaveBeenCalled();
        };
        callbacks.errorCallback = function () {
          expect(callbacks.errorCallback).not.toHaveBeenCalled();
        };

        spyOn(callbacks, 'successCallback').and.callThrough();
        spyOn(callbacks, 'errorCallback').and.callThrough();

        apiFactory.getLocations()
          .then(callbacks.successCallback)
          .catch(callbacks.errorCallback);

        expect(dataFactory.locations).toEqual(null);
      });

      it('should resolve when offline and there are locations in storage', function () {
        var deferred = q.defer();

        store.LOCATIONS = JSON.stringify(locationsMock);

        spyOn(apiFactory, 'online').and.callFake(function () {
          deferred.reject();
          return deferred.promise;
        });

        callbacks.successCallback = function () {
          expect(callbacks.successCallback).toHaveBeenCalled();
        };
        callbacks.errorCallback = function () {
          expect(callbacks.errorCallback).not.toHaveBeenCalled();
        };

        spyOn(callbacks, 'successCallback').and.callThrough();
        spyOn(callbacks, 'errorCallback').and.callThrough();

        apiFactory.getLocations()
          .then(callbacks.successCallback)
          .catch(callbacks.errorCallback);

        expect(dataFactory.locations).toEqual(locationsMock);
      });

      it('should reject on error', function () {
        var deferred = q.defer();

        store.LOCATIONS = undefined;

        spyOn(apiFactory, 'online').and.callFake(function () {
          deferred.resolve();
          return deferred.promise;
        });

        callbacks.successCallback = function () {
          expect(callbacks.successCallback).not.toHaveBeenCalled();
        };
        callbacks.errorCallback = function () {
          expect(callbacks.errorCallback).toHaveBeenCalled();
        };

        spyOn(callbacks, 'successCallback').and.callThrough();
        spyOn(callbacks, 'errorCallback').and.callThrough();

        apiFactory.getLocations()
          .then(callbacks.successCallback)
          .catch(callbacks.errorCallback);

        httpBackend.when('GET', /\.*airquality\/locations.*/).respond(500);
        httpBackend.flush();

        expect(dataFactory.locations).toEqual([]);
      });

      it('should resolve on success', function () {
        var deferred = q.defer();

        store.LOCATIONS = undefined;

        spyOn(apiFactory, 'online').and.callFake(function () {
          deferred.resolve();
          return deferred.promise;
        });

        callbacks.successCallback = function () {
          expect(callbacks.successCallback).toHaveBeenCalled();
        };
        callbacks.errorCallback = function () {
          expect(callbacks.errorCallback).not.toHaveBeenCalled();
        };

        spyOn(callbacks, 'successCallback').and.callThrough();
        spyOn(callbacks, 'errorCallback').and.callThrough();

        apiFactory.getLocations()
          .then(callbacks.successCallback)
          .catch(callbacks.errorCallback);

        httpBackend.when('GET', /\.*airquality\/locations.*/).respond(200, locationsMock);
        httpBackend.flush();

        expect(dataFactory.locations).toEqual(locationsMock);
      });
    });
  }
});
