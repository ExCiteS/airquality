describe('Filter: empty', function () {
  'use strict';

  var filter;

  beforeEach(module('AQ'));
  beforeEach(inject(function ($injector) {
    filter = $injector.get('$filter')('empty');
  }));

  it('should return `false` when input is not a plain object', function () {
    _.each(excludingPlainObjectMock, function (input) {
      expect(filter(input)).toEqual(false);
    });
  });

  it('should return `false` when input is not empty', function () {
    expect(filter({
      id: 15,
      name: 'Julius'
    })).toEqual(false);
  });

  it('should return `true` when input is empty', function () {
    expect(filter({})).toEqual(true);
  });
});
