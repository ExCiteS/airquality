'use strict';

AQ.factory('data', function () {
  var data = {};

  data.authentication = {};
  data.locations = null;
  data.projects = null;

  data.unsynced = {
    locations: []
  };

  return data;
});
