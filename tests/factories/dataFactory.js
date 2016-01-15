describe('Factory: data', function () {
  'use strict';

  var dataFactory;

  beforeEach(module('AQ'));

  beforeEach(inject(function (data) {
    dataFactory = data;
  }));

  it('should have all properties available', function () {
    expect(dataFactory.authentication).not.toBeUndefined();
    expect(dataFactory.locations).not.toBeUndefined();
    expect(dataFactory.location).not.toBeUndefined();
    expect(dataFactory.projects).not.toBeUndefined();
    expect(dataFactory.unsynced.locations).not.toBeUndefined();
  });
});
