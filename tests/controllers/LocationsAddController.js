describe('Controller: LocationsAdd', function () {
  'use strict';

  var scope;
  var controller;

  beforeEach(module('AQ'));

  beforeEach(inject(function ($rootScope, $controller) {
    scope = $rootScope.$new();

    controller = $controller;
  }));

  it('should have personal scope variables set', function () {
    controller('LocationsAddController', {
      $scope: scope
    });

    expect(_.isPlainObject(scope.formGroup)).toEqual(true);
    expect(_.isPlainObject(scope.location)).toEqual(true);
    expect(_.isPlainObject(scope.location.error)).toEqual(true);
  });
});
