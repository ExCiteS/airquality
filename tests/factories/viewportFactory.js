describe('Factory: viewport', function () {
  'use strict';

  var viewportFactory;

  beforeEach(module('AQ'));

  beforeEach(inject(function (viewport) {
    viewportFactory = viewport;
  }));

  it('should have history available', function () {
    expect(viewportFactory.history).not.toBeUndefined();
  });
});
