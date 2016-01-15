describe('Controller: Index', function () {
  'use strict';

  var scope;
  var controller;
  var stateFactory;

  beforeEach(module('AQ'));

  beforeEach(inject(function ($rootScope, $controller, state) {
    scope = $rootScope.$new();
    stateFactory = state;

    spyOn(stateFactory, 'redirect').and.callFake(function () {
      return;
    });

    controller = $controller('IndexController', {
      $scope: scope
    });
  }));

  it('should try to redirect to Locations state', function () {
    scope.$digest();
    expect(stateFactory.redirect).toHaveBeenCalledWith('locations');
  });
});
