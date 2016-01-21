describe('Controller: Register', function () {
  'use strict';

  var scope;
  var controller;
  var dataFactory, stateFactory;

  beforeEach(module('AQ'));

  beforeEach(inject(function ($rootScope, $controller, data, state) {
    scope = $rootScope.$new();
    dataFactory = data;
    stateFactory = state;

    spyOn(stateFactory, 'setTitle').and.callFake(function () {
      return;
    });
    spyOn(stateFactory, 'redirect').and.callFake(function () {
      return;
    });

    controller = $controller;
  }));

  it('should set title', function () {
    controller('RegisterController', {
      $scope: scope
    });

    scope.$digest();
    expect(stateFactory.setTitle).toHaveBeenCalledWith('Register');
  });

  it('should not call a redirection authenticated', function () {
    dataFactory.authentication = {};

    controller('RegisterController', {
      $scope: scope
    });

    scope.$digest();
    expect(stateFactory.redirect).not.toHaveBeenCalled();
  });

  it('should call a redirection when authenticated', function () {
    dataFactory.authentication = _.cloneDeep(authenticationMock);

    controller('RegisterController', {
      $scope: scope
    });

    scope.$digest();
    expect(stateFactory.redirect).toHaveBeenCalledWith('index');
  });
});
