describe('Controller: Location', function () {
  'use strict';

  var q, timeout, stateParams, scope;
  var controller;
  var dataFactory, stateFactory, apiFactory, leafletFactory;

  beforeEach(module('AQ'));

  beforeEach(inject(function ($q, $timeout, $stateParams, $rootScope, $controller, data, state, api, leaflet) {
    q = $q;
    timeout = $timeout;
    stateParams = $stateParams;
    scope = $rootScope.$new();
    dataFactory = data;
    stateFactory = state;
    apiFactory = api;
    leafletFactory = leaflet;

    var deferred = q.defer();

    leafletFactory.map = {
      invalidateSize: function () {
        return;
      },
      getCenter: function () {
        return;
      },
      on: function () {
        return;
      }
    };

    spyOn(window.navigator.notification, 'alert').and.callFake(function () {
      return;
    });
    spyOn(stateFactory, 'setTitle').and.callFake(function () {
      return;
    });
    spyOn(stateFactory, 'redirect').and.callFake(function () {
      return;
    });
    spyOn(apiFactory, 'getLocations').and.callFake(function () {
      deferred.resolve();
      return deferred.promise;
    });
    spyOn(leafletFactory, 'init').and.callFake(function () {
      return;
    });
    spyOn(leafletFactory.map, 'invalidateSize').and.callFake(function () {
      return;
    });
    spyOn(leafletFactory.map, 'getCenter').and.callFake(function () {
      return;
    });
    spyOn(leafletFactory.map, 'on').and.callFake(function () {
      return;
    });

    controller = $controller;
  }));

  it('should set title', function () {
    controller('LocationController', {
      $scope: scope
    });

    expect(stateFactory.setTitle).toHaveBeenCalledWith('Location');
  });

  it('should have personal scope variables set', function () {
    controller('LocationController', {
      $scope: scope
    });

    expect(_.isPlainObject(scope.formGroup)).toEqual(true);
    expect(_.isPlainObject(scope.formGroup.measurements)).toEqual(true);
    expect(_.isPlainObject(scope.measurement)).toEqual(true);
    expect(_.isPlainObject(scope.measurement.error)).toEqual(true);
  });

  it('should get all locations when they are not set yet', function () {
    dataFactory.locations = null;

    controller('LocationController', {
      $scope: scope
    });

    expect(apiFactory.getLocations).toHaveBeenCalled();
  });

  it('should not get all locations when they are already set', function () {
    dataFactory.locations = _.cloneDeep(locationsMock);

    controller('LocationController', {
      $scope: scope
    });

    expect(apiFactory.getLocations).not.toHaveBeenCalled();
  });

  it('should inform when location could not be found', function () {
    stateParams.locationId = 457;
    dataFactory.locations = _.cloneDeep(locationsMock);

    controller('LocationController', {
      $scope: scope
    });

    expect(window.navigator.notification.alert).toHaveBeenCalled();
    expect(stateFactory.redirect).toHaveBeenCalled();
    expect(leafletFactory.init).not.toHaveBeenCalled();
    expect(leafletFactory.map.on).not.toHaveBeenCalled();
    expect(dataFactory.location).toEqual(null);
    timeout.flush(10);
    expect(leafletFactory.map.invalidateSize).not.toHaveBeenCalled();
  });

  it('should prepare location', function () {
    var location = _.cloneDeep(locationMock);
    location.measurements = [];

    stateParams.locationId = location.id;
    dataFactory.locations = [location];

    controller('LocationController', {
      $scope: scope
    });

    expect(window.navigator.notification.alert).not.toHaveBeenCalled();
    expect(stateFactory.redirect).not.toHaveBeenCalled();
    expect(leafletFactory.init).toHaveBeenCalled();
    expect(leafletFactory.map.on).toHaveBeenCalled();
    expect(dataFactory.location).toEqual(locationsMock[0]);
    timeout.flush(10);
    expect(leafletFactory.map.invalidateSize).toHaveBeenCalled();
  });

  it('should make sure that `addResults` property on each measurement is set to `false`', function () {
    var location = _.cloneDeep(locationMock);
    location.measurements = [_.cloneDeep(measurementMock)];

    stateParams.locationId = location.id;
    dataFactory.locations = [location];

    controller('LocationController', {
      $scope: scope
    });

    expect(dataFactory.location.measurements[0].addResults).toEqual(false);
  });
});
