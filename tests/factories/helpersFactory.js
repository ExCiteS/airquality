describe('Factory: helpers', function () {
  'use strict';

  var helpersFactory;

  beforeEach(function () {
    module('AQ');
  });

  beforeEach(inject(function (helpers) {
    helpersFactory = helpers;
  }));

  describe('Public method: serialize', function () {
    it('should throw an error when param is not specified', function () {
      expect(function () {
        helpersFactory.serialize();
      }).toThrow(new Error('Param not specified'));
    });

    it('should throw an error when param is not plain object', function () {
      _.each(excludingPlainObjectMock, function (input) {
        expect(function () {
          helpersFactory.serialize(input);
        }).toThrow(new Error('Param must be plain object'));
      });
    });

    it('should serialize plain object', function () {
      expect(helpersFactory.serialize({
        'One': 1,
        'Two': 2
      })).toEqual('One=1&Two=2');
    });
  });

  describe('Public method: checkEmail', function () {
    it('return `false` when email is not a string', function () {
      _.each(excludingStringMock, function (email) {
        expect(helpersFactory.checkEmail(email)).toEqual(false);
      });
    });

    it('return `false` when email is invalid', function () {
      expect(helpersFactory.checkEmail('@email.com')).toEqual(false);
      expect(helpersFactory.checkEmail('my@.com')).toEqual(false);
      expect(helpersFactory.checkEmail('my@email.')).toEqual(false);
      expect(helpersFactory.checkEmail('my@email')).toEqual(false);
      expect(helpersFactory.checkEmail('@')).toEqual(false);
      expect(helpersFactory.checkEmail('email.com')).toEqual(false);
      expect(helpersFactory.checkEmail('email')).toEqual(false);
    });

    it('return `true` when email is valid', function () {
      expect(helpersFactory.checkEmail('my@email.com')).toEqual(true);
    });
  });
});
