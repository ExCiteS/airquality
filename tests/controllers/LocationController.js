describe('Controller: Location', function () {
  'use strict';

  var q, scope;
  var controller;
  var dataFactory, stateFactory, apiFactory;

  beforeEach(module('AQ'));

  beforeEach(inject(function ($q, $rootScope, $controller, data, state, api) {
    q = $q;
    scope = $rootScope.$new();
    dataFactory = data;
    stateFactory = state;
    apiFactory = api;

    var deferred = q.defer();

    spyOn(stateFactory, 'setTitle').and.callFake(function () {
      return;
    });
    spyOn(apiFactory, 'getLocations').and.callFake(function () {
      deferred.resolve();
      return deferred.promise;
    });

    controller = $controller;
  }));

  it('should set title', function () {
    controller('LocationController', {
      $scope: scope
    });

    scope.$digest();
    expect(stateFactory.setTitle).toHaveBeenCalledWith('Location');
  });

  it('should get locations when they are not set yet', function () {
    dataFactory.locations = null;

    controller('LocationController', {
      $scope: scope
    });

    scope.$digest();
    expect(apiFactory.getLocations).toHaveBeenCalled();
  });
});
