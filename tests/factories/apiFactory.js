describe('Factory: api', function () {
  'use strict';

  var q, httpBackend, rootScope, interval;
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

  beforeEach(inject(function ($q, $httpBackend, $rootScope, $interval, api, data, viewport, oauth) {
    q = $q;
    httpBackend = $httpBackend;
    rootScope = $rootScope;
    interval = $interval;
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

      interval.flush(30);
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

      interval.flush(30);
    });

    it('should wait for viewport to annouce online status', function () {
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

      viewportFactory.online = undefined;
      interval.flush(30);
      viewportFactory.online = true;
      interval.flush(30);
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

      rootScope.$digest();
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

        rootScope.$digest();

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

        rootScope.$digest();

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

  describe('Public method: addLocation', function () {
    var location;

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

      dataFactory.locations = [];

      location = {
        type: 'Feature',
        geometry: {},
        name: 'First location',
        properties: {
          height: 2,
          distance: 3.5,
          characteristics: null
        }
      };
    });

    it('should throw an error when location is not specified', function () {
      expect(function () {
        apiFactory.addLocation();
      }).toThrow(new Error('Location not specified'));
    });

    it('should throw an error when location is not plain object', function () {
      _.each(excludingPlainObjectMock, function (location) {
        expect(function () {
          apiFactory.addLocation(location);
        }).toThrow(new Error('Location must be plain object'));
      });
    });

    it('should resolve when offline and there are no local locations added yet', function () {
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

      apiFactory.addLocation(location)
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      rootScope.$digest();

      expect(dataFactory.locations.length).toEqual(1);
      expect(dataFactory.locations[0].id).toEqual('x1');
    });

    it('should resolve when offline and there are already local locations added', function () {
      var deferred = q.defer();

      dataFactory.locations.push({
        id: 'x1'
      });
      dataFactory.unsynced.locations.push(dataFactory.locations[0]);

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

      apiFactory.addLocation(location)
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      rootScope.$digest();

      expect(dataFactory.locations.length).toEqual(2);
      expect(dataFactory.locations[0].id).toEqual('x1');
      expect(dataFactory.locations[1].id).toEqual('x2');
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

      apiFactory.addLocation(location)
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      httpBackend.when('POST', /\.*airquality\/locations.*/).respond(500);
      httpBackend.flush();

      expect(dataFactory.locations.length).toEqual(0);
    });

    it('should resolve on success when adding location not from local one', function () {
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

      apiFactory.addLocation(location)
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      httpBackend.when('POST', /\.*airquality\/locations.*/).respond(200, locationMock);
      httpBackend.flush();

      expect(dataFactory.locations.length).toEqual(1);
      expect(dataFactory.locations[0].id).toEqual(1);
    });

    it('should resolve on success when adding location from local one', function () {
      var deferred = q.defer();

      location.id = 'x1';
      dataFactory.locations.push(location);

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

      apiFactory.addLocation(location)
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      httpBackend.when('POST', /\.*airquality\/locations.*/).respond(200, locationMock);
      httpBackend.flush();

      expect(dataFactory.locations.length).toEqual(1);
      expect(dataFactory.locations[0].id).toEqual(1);
    });
  });

  describe('Public method: updateLocation', function () {
    var location;

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

      location = _.cloneDeep(locationMock);
      location.name = 'Updated location';

      dataFactory.location = _.cloneDeep(location);
      dataFactory.locations = [location];
    });

    it('should throw an error when location is not specified', function () {
      expect(function () {
        apiFactory.updateLocation();
      }).toThrow(new Error('Location not specified'));
    });

    it('should throw an error when location is not plain object', function () {
      _.each(excludingPlainObjectMock, function (location) {
        expect(function () {
          apiFactory.updateLocation(location);
        }).toThrow(new Error('Location must be plain object'));
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

      apiFactory.updateLocation(location)
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      rootScope.$digest();

      expect(dataFactory.locations.length).toEqual(1);
      expect(dataFactory.locations[0].updated).toEqual(true);
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

      apiFactory.updateLocation(location)
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      httpBackend.when('PATCH', /\.*airquality\/locations\/1.*/).respond(500);
      httpBackend.flush();

      expect(dataFactory.locations.length).toEqual(1);
      expect(dataFactory.locations[0].updated).toBeUndefined();
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

      apiFactory.addLocation(location)
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      httpBackend.when('POST', /\.*airquality\/locations.*/).respond(200, location);
      httpBackend.flush();

      expect(dataFactory.locations.length).toEqual(1);
      expect(dataFactory.locations[0].updated).toBeUndefined();
    });
  });

  describe('Public method: deleteLocation', function () {
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

      dataFactory.location = _.cloneDeep(locationMock);
      dataFactory.locations = [_.cloneDeep(dataFactory.location)];
    });

    it('should throw an error when location ID is not specified', function () {
      expect(function () {
        apiFactory.deleteLocation();
      }).toThrow(new Error('Location ID not specified'));
    });

    it('should resolve when offline and location is still local', function () {
      var deferred = q.defer();

      dataFactory.location.id = 'x' + dataFactory.location.id;
      dataFactory.locations = [_.cloneDeep(dataFactory.location)];
      dataFactory.unsynced.locations = [_.cloneDeep(dataFactory.location)];

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

      apiFactory.deleteLocation(dataFactory.location.id)
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      rootScope.$digest();

      expect(dataFactory.locations.length).toEqual(0);
    });

    it('should resolve when offline and location is not local', function () {
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

      apiFactory.deleteLocation(dataFactory.location.id)
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      rootScope.$digest();

      expect(dataFactory.locations.length).toEqual(1);
      expect(dataFactory.locations[0].deleted).toEqual(true);
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

      apiFactory.deleteLocation(dataFactory.location.id)
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      httpBackend.when('DELETE', /\.*airquality\/locations\/1.*/).respond(500);
      httpBackend.flush();

      expect(dataFactory.locations.length).toEqual(1);
      expect(dataFactory.locations[0].deleted).toBeUndefined();
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

      apiFactory.deleteLocation(dataFactory.location.id)
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      httpBackend.when('DELETE', /\.*airquality\/locations\/1.*/).respond(201);
      httpBackend.flush();

      expect(dataFactory.locations.length).toEqual(0);
    });
  });

  describe('Public method: startMeasurement', function () {
    var measurement;

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

      dataFactory.locations = _.cloneDeep(locationsMock);
      dataFactory.location = _.cloneDeep(locationMock);

      measurement = {
        barcode: '145023'
      };
    });

    it('should throw an error when measurement is not specified', function () {
      expect(function () {
        apiFactory.startMeasurement();
      }).toThrow(new Error('Measurement not specified'));
    });

    it('should throw an error when measurement is not plain object', function () {
      _.each(excludingPlainObjectMock, function (measurement) {
        expect(function () {
          apiFactory.startMeasurement(measurement);
        }).toThrow(new Error('Measurement must be plain object'));
      });
    });

    it('should throw an error when location is not set', function () {
      dataFactory.location = undefined;

      expect(function () {
        apiFactory.startMeasurement(measurement);
      }).toThrow(new Error('Location not set'));
    });

    it('should throw an error when location is not plain object', function () {
      _.each(excludingPlainObjectMock, function (location) {
        dataFactory.location = location;

        expect(function () {
          apiFactory.startMeasurement(measurement);
        }).toThrow(new Error('Location must be plain object'));
      });
    });

    it('should resolve when offline and there are no local measurements started yet', function () {
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

      apiFactory.startMeasurement(measurement, dataFactory.location.id)
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      rootScope.$digest();

      expect(dataFactory.locations[0].measurements.length).toEqual(1);
      expect(dataFactory.locations[0].measurements[0].id).toEqual('x1');
    });

    it('should resolve when offline and there are already local measurements started', function () {
      var deferred = q.defer();

      dataFactory.locations[0].measurements.push({
        id: 'x1'
      });
      dataFactory.unsynced.locations.push(dataFactory.locations[0]);

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

      apiFactory.startMeasurement(measurement, dataFactory.location.id)
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      rootScope.$digest();

      expect(dataFactory.locations[0].measurements.length).toEqual(2);
      expect(dataFactory.locations[0].measurements[0].id).toEqual('x1');
      expect(dataFactory.locations[0].measurements[1].id).toEqual('x2');
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

      apiFactory.startMeasurement(measurement)
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      httpBackend.when('POST', /\.*airquality\/locations\/1\/measurements.*/).respond(500);
      httpBackend.flush();

      expect(dataFactory.locations[0].measurements.length).toEqual(0);
    });

    it('should resolve on success when starting measurement not from local one', function () {
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

      apiFactory.startMeasurement(measurement)
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      httpBackend.when('POST', /\.*airquality\/locations\/1\/measurements.*/).respond(200, measurementMock);
      httpBackend.flush();

      expect(dataFactory.locations[0].measurements.length).toEqual(1);
      expect(dataFactory.locations[0].measurements[0].id).toEqual(1);
    });

    it('should resolve on success when starting location from local one', function () {
      var deferred = q.defer();

      measurement.id = 'x1';
      dataFactory.locations[0].measurements.push(measurement);

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

      apiFactory.startMeasurement(measurement)
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      httpBackend.when('POST', /\.*airquality\/locations\/1\/measurements.*/).respond(200, measurementMock);
      httpBackend.flush();

      expect(dataFactory.locations[0].measurements.length).toEqual(1);
      expect(dataFactory.locations[0].measurements[0].id).toEqual(1);
    });
  });

describe('Public method: updateMeasurement', function () {
    var measurement;

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

      measurement = _.cloneDeep(measurementMock);
      measurement.barcode = '874114';

      var location = _.cloneDeep(locationMock);
      location.measurements.push(measurement);

      dataFactory.location = location;
      dataFactory.locations = [location];
    });

    it('should throw an error when measurement is not specified', function () {
      expect(function () {
        apiFactory.updateMeasurement();
      }).toThrow(new Error('Measurement not specified'));
    });

    it('should throw an error when measurement is not plain object', function () {
      _.each(excludingPlainObjectMock, function (measurement) {
        expect(function () {
          apiFactory.updateMeasurement(measurement);
        }).toThrow(new Error('Measurement must be plain object'));
      });
    });

    it('should throw an error when location is not set', function () {
      dataFactory.location = undefined;

      expect(function () {
        apiFactory.updateMeasurement(measurement);
      }).toThrow(new Error('Location not set'));
    });

    it('should throw an error when location is not plain object', function () {
      _.each(excludingPlainObjectMock, function (location) {
        dataFactory.location = location;

        expect(function () {
          apiFactory.updateMeasurement(measurement);
        }).toThrow(new Error('Location must be plain object'));
      });
    });

    it('should resolve when offline but not submitting', function () {
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

      apiFactory.updateMeasurement(measurement, dataFactory.location.id)
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      rootScope.$digest();

      expect(dataFactory.locations[0].measurements.length).toEqual(1);
      expect(dataFactory.locations[0].measurements[0].updated).toEqual(true);
      expect(dataFactory.locations[0].measurements[0].submitted).toBeUndefined();
    });

    it('should resolve when offline and submitting', function () {
      var deferred = q.defer();

      measurement.submit = true;

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

      apiFactory.updateMeasurement(measurement, dataFactory.location.id)
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      rootScope.$digest();

      expect(dataFactory.locations[0].measurements.length).toEqual(1);
      expect(dataFactory.locations[0].measurements[0].updated).toEqual(true);
      expect(dataFactory.locations[0].measurements[0].submitted).not.toBeUndefined();
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

      apiFactory.updateMeasurement(measurement)
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      httpBackend.when('PATCH', /\.*airquality\/locations\/1\/measurements\/1.*/).respond(500);
      httpBackend.flush();

      expect(dataFactory.locations[0].measurements.length).toEqual(1);
      expect(dataFactory.locations[0].measurements[0].updated).toBeUndefined();
    });

    it('should resolve on success when only updating', function () {
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

      apiFactory.updateMeasurement(measurement)
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      httpBackend.when('PATCH', /\.*airquality\/locations\/1\/measurements\/1.*/).respond(200, measurement);
      httpBackend.flush();

      expect(dataFactory.locations[0].measurements.length).toEqual(1);
      expect(dataFactory.locations[0].measurements[0].updated).toBeUndefined();
    });

    it('should resolve on success when finishing', function () {
      var deferred = q.defer();

      measurement.submit = true;

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

      apiFactory.updateMeasurement(measurement)
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      httpBackend.when('PATCH', /\.*airquality\/locations\/1\/measurements\/1.*/).respond(201);
      httpBackend.flush();

      expect(dataFactory.locations[0].measurements.length).toEqual(0);
    });
  });

  describe('Public method: removeMeasurement', function () {
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

      var location = _.cloneDeep(locationMock);
      location.measurements.push(_.cloneDeep(measurementMock));

      dataFactory.location = location;
      dataFactory.locations = [location];
    });

    it('should throw an error when measurement ID is not specified', function () {
      expect(function () {
        apiFactory.removeMeasurement();
      }).toThrow(new Error('Measurement ID not specified'));
    });

    it('should throw an error when location is not set', function () {
      dataFactory.location = undefined;

      expect(function () {
        apiFactory.removeMeasurement(1);
      }).toThrow(new Error('Location not set'));
    });

    it('should throw an error when location is not plain object', function () {
      _.each(excludingPlainObjectMock, function (location) {
        dataFactory.location = location;

        expect(function () {
          apiFactory.removeMeasurement(1);
        }).toThrow(new Error('Location must be plain object'));
      });
    });

    it('should resolve when offline and measurement is still local', function () {
      var deferred = q.defer();

      dataFactory.location.measurements[0].id = 'x' + dataFactory.location.measurements[0].id;
      dataFactory.locations = [_.cloneDeep(dataFactory.location)];
      dataFactory.unsynced.locations = [_.cloneDeep(dataFactory.location)];

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

      apiFactory.removeMeasurement(dataFactory.location.measurements[0].id, dataFactory.location.id)
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      rootScope.$digest();

      expect(dataFactory.locations[0].measurements.length).toEqual(0);
    });

    it('should resolve when offline and location is not local', function () {
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

      apiFactory.removeMeasurement(dataFactory.location.measurements[0].id, dataFactory.location.id)
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      rootScope.$digest();

      expect(dataFactory.locations[0].measurements.length).toEqual(1);
      expect(dataFactory.locations[0].measurements[0].deleted).toEqual(true);
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

      apiFactory.removeMeasurement(dataFactory.location.measurements[0].id)
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      httpBackend.when('DELETE', /\.*airquality\/locations\/1\/measurements\/1.*/).respond(500);
      httpBackend.flush();

      expect(dataFactory.locations[0].measurements.length).toEqual(1);
      expect(dataFactory.locations[0].measurements[0].deleted).toBeUndefined();
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

      apiFactory.removeMeasurement(dataFactory.location.measurements[0].id)
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      httpBackend.when('DELETE', /\.*airquality\/locations\/1\/measurements\/1.*/).respond(201);
      httpBackend.flush();

      expect(dataFactory.locations[0].measurements.length).toEqual(0);
    });
  });

  // Exclude Firefox
  if (navigator.userAgent.indexOf('Firefox') == -1) {
    describe('Public method: getProjects', function () {
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

      it('should resolve when offline and there are no projects in storage', function () {
        var deferred = q.defer();

        store.PROJECTS = undefined;

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

        apiFactory.getProjects()
          .then(callbacks.successCallback)
          .catch(callbacks.errorCallback);

        rootScope.$digest();

        expect(dataFactory.projects).toEqual([]);
      });

      it('should resolve when offline and there are projects in storage', function () {
        var deferred = q.defer();

        store.PROJECTS = JSON.stringify(projectsMock);

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

        apiFactory.getProjects()
          .then(callbacks.successCallback)
          .catch(callbacks.errorCallback);

        rootScope.$digest();

        expect(dataFactory.projects).toEqual(projectsMock);
      });

      it('should reject on error and there are no projects in storage', function () {
        var deferred = q.defer();

        store.PROJECTS = undefined;

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

        apiFactory.getProjects()
          .then(callbacks.successCallback)
          .catch(callbacks.errorCallback);

        httpBackend.when('GET', /\.*airquality\/projects.*/).respond(500);
        httpBackend.flush();

        expect(dataFactory.projects).toEqual([]);
      });

      it('should reject on error and there are projects in storage', function () {
        var deferred = q.defer();

        store.PROJECTS = JSON.stringify(projectsMock);

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

        apiFactory.getProjects()
          .then(callbacks.successCallback)
          .catch(callbacks.errorCallback);

        httpBackend.when('GET', /\.*airquality\/projects.*/).respond(500);
        httpBackend.flush();

        expect(dataFactory.projects).toEqual(projectsMock);
      });

      it('should resolve on success', function () {
        var deferred = q.defer();

        store.PROJECTS = undefined;

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

        apiFactory.getProjects()
          .then(callbacks.successCallback)
          .catch(callbacks.errorCallback);

        httpBackend.when('GET', /\.*airquality\/projects.*/).respond(200, projectsMock);
        httpBackend.flush();

        expect(dataFactory.projects).toEqual(projectsMock);
      });
    });
  }
});
