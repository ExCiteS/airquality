describe('Controller: 404', function () {
  'use strict';

  var scope;
  var controller;
  var stateFactory;

  beforeEach(module('AQ'));

  beforeEach(inject(function ($rootScope, $controller, state) {
    scope = $rootScope.$new();
    stateFactory = state;

    spyOn(window.navigator.notification, 'alert').and.callFake(function () {
      return;
    });
    spyOn(stateFactory, 'redirect').and.callFake(function () {
      return;
    });

    controller = $controller('404Controller', {
      $scope: scope
    });
  }));

  it('should show an alert', function () {
    expect(window.navigator.notification.alert).toHaveBeenCalled();
  });

  it('should redirect to the previous state', function () {
    expect(stateFactory.redirect).toHaveBeenCalled();
  });
});
