describe('Controller: LocationEdit', function () {
  'use strict';

  var scope;
  var controller;

  beforeEach(module('AQ'));

  beforeEach(inject(function ($rootScope, $controller) {
    scope = $rootScope.$new();

    controller = $controller;
  }));

  it('should have personal scope variables set', function () {
    controller('LocationEditController', {
      $scope: scope
    });

    expect(_.isPlainObject(scope.formGroup)).toEqual(true);
    expect(_.isPlainObject(scope.location)).toEqual(true);
    expect(_.isPlainObject(scope.location.error)).toEqual(true);
  });
});
