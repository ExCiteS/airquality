describe('Filter: active', function () {
  'use strict';

  var filter;

  beforeEach(module('AQ'));
  beforeEach(inject(function ($injector) {
    filter = $injector.get('$filter')('active');
  }));

  it('should still return an empty array when items is not an array', function () {
    _.each(excludingArrayMock, function (items) {
      expect(filter(items)).toEqual([]);
    });
  });

  it('should exclude deteled items', function () {
    var items = [{
      deleted: false
    }, {
      deleted: true
    }];

    var result = filter(items);
    expect(_.size(result)).toEqual(1);
    expect(result[0].deleted).toEqual(false);
  });
});
