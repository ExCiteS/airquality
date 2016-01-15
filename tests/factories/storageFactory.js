describe('Factory: storage', function () {
  'use strict';

  var storageFactory;
  var store = {};

  beforeEach(function () {
    module('AQ');

    spyOn(localStorage, 'getItem').and.callFake(function (key) {
      return store[key];
    });
    Object.defineProperty(localStorage, 'getItem', {
      configurable: true,
      writable: true
    });

    spyOn(localStorage, 'setItem').and.callFake(function (key, value) {
      store[key] = value;
    });
    Object.defineProperty(localStorage, 'setItem', {
      configurable: true,
      writable: true
    });

    spyOn(localStorage, 'removeItem').and.callFake(function (key) {
      delete store[key];
    });
    Object.defineProperty(localStorage, 'removeItem', {
      configurable: true,
      writable: true
    });
  });

  beforeEach(inject(function (storage) {
    storageFactory = storage;
  }));

  afterEach(function () {
    store = {};
  });

  describe('Public method: get', function () {
    it('should throw an error when name is not set', function () {
      expect(function () {
        storageFactory.get();
      }).toThrow(new Error('Name must be set'));
    });

    it('should get an item', function () {
      store = {
        'test': 'This is a test.'
      };
      expect(storageFactory.get('test')).toEqual('This is a test.');
    });
  });

  describe('Public method: put', function () {
    it('should throw an error when name is not set', function () {
      expect(function () {
        storageFactory.put();
      }).toThrow(new Error('Name must be set'));
    });

    it('should put an item', function () {
      storageFactory.put('test', 'This is yet another test.');
      expect(store.test).toEqual('This is yet another test.');
    });
  });

  describe('Public method: remove', function () {
    it('should throw an error when name is not set', function () {
      expect(function () {
        storageFactory.remove();
      }).toThrow(new Error('Name must be set'));
    });

    it('should remove an item', function () {
      store = {
        'test': 'This is a third test.'
      };
      storageFactory.remove('test');
      expect(store.test).toBeUndefined();
    });
  });
});
