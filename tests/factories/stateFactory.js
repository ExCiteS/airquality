describe('Factory: state', function () {
  'use strict';

  var location, rootScope;
  var stateFactory, dataFactory, viewportFactory;
  var mainTitle = 'Air Quality';

  beforeEach(function () {
    module('AQ');
  });

  beforeEach(inject(function ($location, $rootScope, state, data, viewport) {
    location = $location;
    rootScope = $rootScope;
    stateFactory = state;
    dataFactory = data;
    viewportFactory = viewport;
  }));

  describe('Public method: redirect', function () {
    beforeEach(function () {
      dataFactory.authentication = _.cloneDeep(authenticationMock);
    });

    it('should always redirect to Login state when not authenticated', function () {
      dataFactory.authentication = {};

      stateFactory.redirect('locations');
      rootScope.$digest();
      expect(location.path()).toEqual('/login');

      stateFactory.redirect('location', {
        locationId: 5
      });
      rootScope.$digest();
      expect(location.path()).toEqual('/login');
    });

    it('should redirect to specific state', function () {
      stateFactory.redirect('locations');
      rootScope.$digest();
      expect(location.path()).toEqual('/locations');

      stateFactory.redirect('location', {
        locationId: 5
      });
      rootScope.$digest();
      expect(location.path()).toEqual('/location/5');
    });

    it('should redirect to previous state when history is set', function () {
      viewportFactory.history = {
        previousState: 'locations'
      };
      stateFactory.redirect();
      rootScope.$digest();
      expect(location.path()).toEqual('/locations');

      viewportFactory.history = {
        previousState: 'location',
        previousParams: {
          locationId: 5
        }
      };
      stateFactory.redirect();
      rootScope.$digest();
      expect(location.path()).toEqual('/location/5');
    });

    it('should redirect to Index state when history is not set', function () {
      viewportFactory.history = {};
      stateFactory.redirect();
      rootScope.$digest();
      expect(location.path()).toEqual('/');
    });
  });

  describe('Public method: goToLocation', function () {
    beforeEach(function () {
      spyOn(stateFactory, 'redirect').and.callFake(function () {
        return;
      });
    });

    it('should throw an error when location ID is not specified', function () {
      expect(function () {
        stateFactory.goToLocation();
      }).toThrow(new Error('Location ID not specified'));
    });

    it('should go to specified location', function () {
      stateFactory.goToLocation(5);
      expect(stateFactory.redirect).toHaveBeenCalledWith('location', {
        locationId: 5
      });
    });
  });

  describe('Public method: editLocation', function () {
    beforeEach(function () {
      spyOn(stateFactory, 'redirect').and.callFake(function () {
        return;
      });
    });

    it('should throw an error when location ID is not specified', function () {
      expect(function () {
        stateFactory.editLocation();
      }).toThrow(new Error('Location ID not specified'));
    });

    it('should go to specified edit of location', function () {
      stateFactory.editLocation(5);
      expect(stateFactory.redirect).toHaveBeenCalledWith('location.edit', {
        locationId: 5
      });
    });
  });

  describe('Public method: goToExternalPage', function () {
    beforeEach(function () {
      spyOn(window, 'open').and.callThrough();
    });

    it('should throw an error when URL is not specified', function () {
      expect(function () {
        stateFactory.goToExternalPage();
      }).toThrow(new Error('URL not specified'));

      expect(window.open).not.toHaveBeenCalled();
    });

    it('should throw an error when URL is not a string', function () {
      _.each(excludingStringMock, function (url) {
        expect(function () {
          stateFactory.goToExternalPage(url);
        }).toThrow(new Error('URL must be a string'));
      });

      expect(window.open).not.toHaveBeenCalled();
    });

    it('should open external page', function () {
      stateFactory.goToExternalPage('http://mappingforchange.org.uk');
      expect(window.open).toHaveBeenCalledWith('http://mappingforchange.org.uk');
    });
  });

  describe('Public method: saveHistory', function () {
    it('should throw an error when current state is not specified', function () {
      expect(function () {
        stateFactory.saveHistory();
      }).toThrow(new Error('Current state not specified'));
    });

    it('should throw an error when current state is not a string', function () {
      _.each(excludingStringMock, function (currentState) {
        expect(function () {
          stateFactory.saveHistory(currentState);
        }).toThrow(new Error('Current state must be a string'));
      });
    });

    it('should exclude some states from history previous entry', function () {
      viewportFactory.history.currentState = '404';
      stateFactory.saveHistory('login');
      expect(viewportFactory.history.previousState).toBeUndefined();
      expect(viewportFactory.history.currentState).toEqual('login');

      viewportFactory.history.currentState = 'redirect';
      stateFactory.saveHistory('login');
      expect(viewportFactory.history.previousState).toBeUndefined();
      expect(viewportFactory.history.currentState).toEqual('login');
    });

    it('should save current state and params in the history', function () {
      viewportFactory.history.currentState = 'login';
      stateFactory.saveHistory('location', {
        locationId: 5
      });
      expect(viewportFactory.history.currentState).toEqual('location');
      expect(viewportFactory.history.currentParams).toEqual({
        locationId: 5
      });
    });

    it('should set current state and params to previous entry in the history', function () {
      viewportFactory.history.currentState = 'location';
      viewportFactory.history.currentParams = {
        locationId: 5
      };
      stateFactory.saveHistory('locations');
      expect(viewportFactory.history.currentState).toEqual('locations');
      expect(viewportFactory.history.currentParams).toBeUndefined();
      expect(viewportFactory.history.previousState).toEqual('location');
      expect(viewportFactory.history.previousParams).toEqual({
        locationId: 5
      });
    });
  });

  describe('Public method: setTitle', function () {
    it('should set main title only', function () {
      stateFactory.setTitle();
      expect(viewportFactory.title).toEqual(mainTitle);
    });

    it('should set title without subtitle', function () {
      var title = 'Test Title';
      var subtitle = undefined;

      stateFactory.setTitle(title, subtitle);
      expect(viewportFactory.title).toEqual(title + ' | ' + mainTitle);
    });

    it('should set title with subtitle', function () {
      var title = 'Test Title';
      var subtitle = 'Test Subtitle';

      stateFactory.setTitle(title, subtitle);
      expect(viewportFactory.title).toEqual(title + ': ' + subtitle + ' | ' + mainTitle);
    });
  });
});
