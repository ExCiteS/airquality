describe('Controller: Redirect', function () {
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

    controller = $controller('RedirectController', {
      $scope: scope
    });
  }));

  it('should call a redirection', function () {
    scope.$digest();
    expect(stateFactory.redirect).toHaveBeenCalled();
  });
});
