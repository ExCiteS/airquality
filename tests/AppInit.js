describe('AppInit', function () {
  'use strict';

  var location, scope;

  beforeEach(module('AQ'));

  beforeEach(inject(function ($window, $location, $rootScope) {
    location = $location;
    scope = $rootScope.$new();
  }));

  it('should redirect non-existing URLs to 404', function () {
    location.url('/non-existing');
    scope.$emit('$locationChangeSuccess');
    expect(location.url()).toEqual('/404');
  });

  it('should remove trailing slash from URL', function () {
    location.url('/login/');
    scope.$emit('$locationChangeSuccess');
    expect(location.url()).toEqual('/login');
  });

  it('should remove trailing slash from URL but keep params', function () {
    location.url('/login/?param=value');
    scope.$emit('$locationChangeSuccess');
    expect(location.url()).toEqual('/login?param=value');
  });

  it('should not change URL if it has no trailing slash', function () {
    var url;

    url = '/login';
    location.url(url);
    scope.$emit('$locationChangeSuccess');
    expect(location.url()).toEqual(url);
  });
});
