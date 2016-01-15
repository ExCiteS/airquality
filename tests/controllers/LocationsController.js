describe('Controller: Locations', function () {
  'use strict';

  var scope;
  var controller;
  var dataFactory, stateFactory, apiFactory;

  beforeEach(module('AQ'));

  beforeEach(inject(function ($rootScope, $controller, data, state, api) {
    scope = $rootScope.$new();
    dataFactory = data;
    stateFactory = state;
    apiFactory = api;

    spyOn(stateFactory, 'setTitle').and.callFake(function () {
      return;
    });
    spyOn(apiFactory, 'getLocations').and.callFake(function () {
      return;
    });

    controller = $controller('LocationsController', {
      $scope: scope
    });
  }));

  it('should set title', function () {
    scope.$digest();
    expect(stateFactory.setTitle).toHaveBeenCalledWith('Locations');
  });

  it('should get locations when they are not set yet', function () {
    dataFactory.locations = null;
    scope.$digest();
    expect(apiFactory.getLocations).toHaveBeenCalled();
  });

  it('should not get locations when they are already yet', function () {
    dataFactory.locations = _.cloneDeep(locationsMock);
    scope.$digest();
    expect(apiFactory.getLocations).toHaveBeenCalled();
  });
});
