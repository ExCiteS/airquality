describe('Filter: newline', function () {
  'use strict';

  var filter;

  beforeEach(module('AQ'));
  beforeEach(inject(function ($injector) {
    filter = $injector.get('$filter')('newline');
  }));

  it('should not process when input is not a string', function () {
    _.each(excludingStringMock, function (input) {
      expect(filter(input)).toEqual(input);
    });
  });

  it('should convert newlines to HTML line breaks', function () {
    var input = 'London is the capital of UK.\nIt had a population of 8,416,535 in 2013.';
    expect(filter(input)).toEqual('London is the capital of UK.<br />It had a population of 8,416,535 in 2013.');
  });
});
