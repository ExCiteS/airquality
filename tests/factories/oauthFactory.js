describe('Factory: oauth', function () {
  'use strict';

  var q, httpBackend;
  var oauthFactory, dataFactory, stateFactory;
  var store = {},
    callbacks;

  beforeEach(function () {
    module('AQ');

    // Exclude Firefox
    if (navigator.userAgent.indexOf('Firefox') == -1) {
      spyOn(localStorage, 'getItem').and.callFake(function (key) {
        return store[key];
      });
      spyOn(localStorage, 'setItem').and.callFake(function (key, value) {
        store[key] = value;
      });
      spyOn(localStorage, 'removeItem').and.callFake(function (key) {
        delete store[key];
      });
    }

    callbacks = function () {};
  });

  beforeEach(inject(function ($q, $httpBackend, oauth, data, state) {
    q = $q;
    httpBackend = $httpBackend;
    oauthFactory = oauth;
    dataFactory = data;
    stateFactory = state;
  }));

  afterEach(function () {
    store = {};
  });

  describe('Public method: register', function () {
    it('should throw an error when email is not specified', function () {
      expect(function () {
        oauthFactory.register(undefined, 'Test User', 'password123', 'password123');
      }).toThrow(new Error('Email not specified'));
    });

    it('should throw an error when email is not a string', function () {
      _.each(excludingStringMock, function (email) {
        expect(function () {
          oauthFactory.register(email, 'Test User', 'password123', 'password123');
        }).toThrow(new Error('Email must be a string'));
      });
    });

    it('should throw an error when display name is not specified', function () {
      expect(function () {
        oauthFactory.register('test@email.com', undefined, 'password123', 'password123');
      }).toThrow(new Error('Display name not specified'));
    });

    it('should throw an error when display name is not a string', function () {
      _.each(excludingStringMock, function (displayName) {
        expect(function () {
          oauthFactory.register('test@email.com', displayName, 'password123', 'password123');
        }).toThrow(new Error('Display name must be a string'));
      });
    });

    it('should throw an error when password 1 is not specified', function () {
      expect(function () {
        oauthFactory.register('test@email.com', 'Test User', undefined, 'password123');
      }).toThrow(new Error('Password 1 not specified'));
    });

    it('should throw an error when password 1 is not a string', function () {
      _.each(excludingStringMock, function (password1) {
        expect(function () {
          oauthFactory.register('test@email.com', 'Test User', password1, 'password123');
        }).toThrow(new Error('Password 1 must be a string'));
      });
    });

    it('should throw an error when password 2 is not specified', function () {
      expect(function () {
        oauthFactory.register('test@email.com', 'Test User', 'password123', undefined);
      }).toThrow(new Error('Password 2 not specified'));
    });

    it('should throw an error when password 2 is not a string', function () {
      _.each(excludingStringMock, function (password2) {
        expect(function () {
          oauthFactory.register('test@email.com', 'Test User', 'password123', password2);
        }).toThrow(new Error('Password 2 must be a string'));
      });
    });

    it('should throw an error when passwords do not match', function () {
      expect(function () {
        oauthFactory.register('test@email.com', 'Test User', 'password123', 'password321');
      }).toThrow(new Error('Passwords do not match'));
    });

    it('should reject on error', function () {
      callbacks.successCallback = function () {
        expect(callbacks.successCallback).not.toHaveBeenCalled();
      };
      callbacks.errorCallback = function () {
        expect(callbacks.errorCallback).toHaveBeenCalled();
      };

      spyOn(callbacks, 'successCallback').and.callThrough();
      spyOn(callbacks, 'errorCallback').and.callThrough();

      oauthFactory.register('test@email.com', 'Test User', 'password123', 'password123')
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      httpBackend.when('POST', /\.*user.*/).respond(400);
      httpBackend.flush();
    });

    it('should resolve on success', function () {
      callbacks.successCallback = function () {
        expect(callbacks.successCallback).toHaveBeenCalled();
      };
      callbacks.errorCallback = function () {
        expect(callbacks.errorCallback).not.toHaveBeenCalled();
      };

      spyOn(callbacks, 'successCallback').and.callThrough();
      spyOn(callbacks, 'errorCallback').and.callThrough();

      oauthFactory.register('test@email.com', 'Test User', 'password123', 'password123')
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      httpBackend.when('POST', /\.*user.*/).respond(201, {});
      httpBackend.flush();
    });
  });

  describe('Public method: authenticate', function () {
    beforeEach(function () {
      var deferred = q.defer();

      spyOn(oauthFactory, 'authorize').and.callFake(function () {
        deferred.resolve();
        return deferred.promise;
      });
    });

    it('should throw an error when email is not specified', function () {
      expect(function () {
        oauthFactory.authenticate(undefined, 'password123');
      }).toThrow(new Error('Email not specified'));
    });

    it('should throw an error when email is not a string', function () {
      _.each(excludingStringMock, function (email) {
        expect(function () {
          oauthFactory.authenticate(email, 'password123');
        }).toThrow(new Error('Email must be a string'));
      });
    });

    it('should throw an error when password is not specified', function () {
      expect(function () {
        oauthFactory.authenticate('test@email.com', undefined);
      }).toThrow(new Error('Password not specified'));
    });

    it('should throw an error when password is not a string', function () {
      _.each(excludingStringMock, function (password) {
        expect(function () {
          oauthFactory.authenticate('test@email.com', password);
        }).toThrow(new Error('Password must be a string'));
      });
    });

    it('should reject on error', function () {
      callbacks.successCallback = function () {
        expect(callbacks.successCallback).not.toHaveBeenCalled();
      };
      callbacks.errorCallback = function () {
        expect(callbacks.errorCallback).toHaveBeenCalled();
      };

      spyOn(callbacks, 'successCallback').and.callThrough();
      spyOn(callbacks, 'errorCallback').and.callThrough();

      oauthFactory.authenticate('test@email.com', 'password123')
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      httpBackend.when('POST', /\.*oauth2\/token.*/).respond(400);
      httpBackend.flush();

      expect(oauthFactory.authorize).not.toHaveBeenCalled();
    });

    it('should resolve on success', function () {
      callbacks.successCallback = function () {
        expect(callbacks.successCallback).toHaveBeenCalled();
      };
      callbacks.errorCallback = function () {
        expect(callbacks.errorCallback).not.toHaveBeenCalled();
      };

      spyOn(callbacks, 'successCallback').and.callThrough();
      spyOn(callbacks, 'errorCallback').and.callThrough();

      oauthFactory.authenticate('test@email.com', 'password123')
        .then(callbacks.successCallback)
        .catch(callbacks.errorCallback);

      httpBackend.when('POST', /\.*oauth2\/token.*/).respond(201, authenticationMock);
      httpBackend.flush();

      expect(oauthFactory.authorize).toHaveBeenCalled();
    });
  });

  // Exclude Firefox
  if (navigator.userAgent.indexOf('Firefox') == -1) {
    describe('Public method: revoke', function () {
      beforeEach(function () {
        var deferred = q.defer();

        store.AUTHENTICATION = JSON.stringify(authenticationMock);
        dataFactory.authentication = _.cloneDeep(authenticationMock);

        spyOn(oauthFactory, 'authorize').and.callFake(function () {
          deferred.resolve();
          return deferred.promise;
        });
      });

      it('should reject when user is not authenticated', function () {
        dataFactory.authentication = {};

        callbacks.successCallback = function () {
          expect(callbacks.successCallback).not.toHaveBeenCalled();
        };
        callbacks.errorCallback = function () {
          expect(callbacks.errorCallback).toHaveBeenCalled();
        };

        spyOn(callbacks, 'successCallback').and.callThrough();
        spyOn(callbacks, 'errorCallback').and.callThrough();

        oauthFactory.revoke()
          .then(callbacks.successCallback)
          .catch(callbacks.errorCallback);

        expect(oauthFactory.authorize).not.toHaveBeenCalled();
      });

      it('should try to authorize on error', function () {
        callbacks.successCallback = function () {
          expect(callbacks.successCallback).toHaveBeenCalled();
        };
        callbacks.errorCallback = function () {
          expect(callbacks.errorCallback).not.toHaveBeenCalled();
        };

        spyOn(callbacks, 'successCallback').and.callThrough();
        spyOn(callbacks, 'errorCallback').and.callThrough();

        oauthFactory.revoke()
          .then(callbacks.successCallback)
          .catch(callbacks.errorCallback);

        httpBackend.when('POST', /\.*oauth2\/revoke_token.*/).respond(500);
        httpBackend.flush();

        expect(oauthFactory.authorize).toHaveBeenCalled();
      });

      it('should try to authorize on success', function () {
        callbacks.successCallback = function () {
          expect(callbacks.successCallback).toHaveBeenCalled();
        };
        callbacks.errorCallback = function () {
          expect(callbacks.errorCallback).not.toHaveBeenCalled();
        };

        spyOn(callbacks, 'successCallback').and.callThrough();
        spyOn(callbacks, 'errorCallback').and.callThrough();

        oauthFactory.revoke()
          .then(callbacks.successCallback)
          .catch(callbacks.errorCallback);

        httpBackend.when('POST', /\.*oauth2\/revoke_token.*/).respond(200);
        httpBackend.flush();

        expect(oauthFactory.authorize).toHaveBeenCalled();
      });
    });

    describe('Public method: refresh', function () {
      beforeEach(function () {
        var deferred = q.defer();

        store.AUTHENTICATION = JSON.stringify(authenticationMock);
        dataFactory.authentication = _.cloneDeep(authenticationMock);

        spyOn(oauthFactory, 'authorize').and.callFake(function () {
          deferred.resolve();
          return deferred.promise;
        });
        spyOn(oauthFactory, 'revoke').and.callFake(function () {
          deferred.resolve();
          return deferred.promise;
        });
        spyOn(stateFactory, 'redirect').and.callFake(function () {
          return;
        });
      });

      it('should reject when user is not authenticated', function () {
        store.AUTHENTICATION = undefined;
        dataFactory.authentication = {};

        callbacks.successCallback = function () {
          expect(callbacks.successCallback).not.toHaveBeenCalled();
        };
        callbacks.errorCallback = function () {
          expect(callbacks.errorCallback).toHaveBeenCalled();
        };

        spyOn(callbacks, 'successCallback').and.callThrough();
        spyOn(callbacks, 'errorCallback').and.callThrough();

        oauthFactory.refresh()
          .then(callbacks.successCallback)
          .catch(callbacks.errorCallback);

        expect(oauthFactory.authorize).not.toHaveBeenCalled();
        expect(oauthFactory.revoke).not.toHaveBeenCalled();
        expect(stateFactory.redirect).not.toHaveBeenCalled();
      });

      it('should reject when token has not expired yet', function () {
        dataFactory.authentication.expires_at = Math.floor(Date.now() / 1000) + authenticationMock.expires_in;

        callbacks.successCallback = function () {
          expect(callbacks.successCallback).not.toHaveBeenCalled();
        };
        callbacks.errorCallback = function () {
          expect(callbacks.errorCallback).toHaveBeenCalled();
        };

        spyOn(callbacks, 'successCallback').and.callThrough();
        spyOn(callbacks, 'errorCallback').and.callThrough();

        oauthFactory.refresh()
          .then(callbacks.successCallback)
          .catch(callbacks.errorCallback);

        expect(oauthFactory.authorize).not.toHaveBeenCalled();
        expect(oauthFactory.revoke).not.toHaveBeenCalled();
        expect(stateFactory.redirect).not.toHaveBeenCalled();
      });

      it('should reject on error', function () {
        dataFactory.authentication.expires_at = Math.floor(Date.now() / 1000) - 300;

        callbacks.successCallback = function () {
          expect(callbacks.successCallback).not.toHaveBeenCalled();
        };
        callbacks.errorCallback = function () {
          expect(callbacks.errorCallback).toHaveBeenCalled();
        };

        spyOn(callbacks, 'successCallback').and.callThrough();
        spyOn(callbacks, 'errorCallback').and.callThrough();

        oauthFactory.refresh()
          .then(callbacks.successCallback)
          .catch(callbacks.errorCallback);

        httpBackend.when('POST', /\.*oauth2\/token.*/).respond(500);
        httpBackend.flush();

        expect(oauthFactory.authorize).not.toHaveBeenCalled();
        expect(oauthFactory.revoke).toHaveBeenCalled();
        expect(stateFactory.redirect).toHaveBeenCalled();
      });

      it('should resolve on success', function () {
        dataFactory.authentication.expires_at = Math.floor(Date.now() / 1000) - 300;

        callbacks.successCallback = function () {
          expect(callbacks.successCallback).toHaveBeenCalled();
        };
        callbacks.errorCallback = function () {
          expect(callbacks.errorCallback).not.toHaveBeenCalled();
        };

        spyOn(callbacks, 'successCallback').and.callThrough();
        spyOn(callbacks, 'errorCallback').and.callThrough();

        oauthFactory.refresh()
          .then(callbacks.successCallback)
          .catch(callbacks.errorCallback);

        httpBackend.when('POST', /\.*oauth2\/token.*/).respond(201, authenticationMock);
        httpBackend.flush();

        expect(oauthFactory.authorize).toHaveBeenCalled();
        expect(oauthFactory.revoke).not.toHaveBeenCalled();
        expect(JSON.parse(store.AUTHENTICATION).expires_at).toEqual(Math.floor(Date.now() / 1000) + authenticationMock.expires_in);
      });
    });

    describe('Public method: authorize', function () {
      it('should reject when user is not authenticated', function () {
        store.AUTHENTICATION = undefined;

        callbacks.successCallback = function () {
          expect(callbacks.successCallback).not.toHaveBeenCalled();
        };
        callbacks.errorCallback = function () {
          expect(callbacks.errorCallback).toHaveBeenCalled();
        };

        spyOn(callbacks, 'successCallback').and.callThrough();
        spyOn(callbacks, 'errorCallback').and.callThrough();

        oauthFactory.authorize()
          .then(callbacks.successCallback)
          .catch(callbacks.errorCallback);

        expect(dataFactory.authentication).toEqual({});
        expect(dataFactory.locations).toEqual(null);
        expect(dataFactory.location).toEqual(null);
      });

      it('should resolve when user is authenticated', function () {
        store.AUTHENTICATION = JSON.stringify(authenticationMock);

        callbacks.successCallback = function () {
          expect(callbacks.successCallback).toHaveBeenCalled();
        };
        callbacks.errorCallback = function () {
          expect(callbacks.errorCallback).to.toHaveBeenCalled();
        };

        spyOn(callbacks, 'successCallback').and.callThrough();
        spyOn(callbacks, 'errorCallback').and.callThrough();

        oauthFactory.authorize()
          .then(callbacks.successCallback)
          .catch(callbacks.errorCallback);

        expect(dataFactory.authentication).toEqual(authenticationMock);
      });
    });
  }
});
