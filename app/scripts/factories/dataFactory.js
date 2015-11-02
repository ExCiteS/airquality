'use strict';

AQ.factory('data', function () {
  var data = {};

  data.authentication = {};
  data.points = [];
  data.projects = [];

  data.unsynced = {
    points: []
  };

  return data;
});
