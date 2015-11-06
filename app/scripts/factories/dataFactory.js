'use strict';

AQ.factory('data', function () {
  var data = {};

  data.authentication = {};
  data.points = null;
  data.projects = null;

  data.unsynced = {
    points: []
  };

  return data;
});
