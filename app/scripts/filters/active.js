'use strict';

AQ.filter('active', function () {
  return function (points) {
    var activeOnly = [];

    if (_.isArray(points)) {
      _.each(points, function (point) {
        if (!point.deleted) {
          activeOnly.push(point);
        }
      });
    }

    return activeOnly;
  };
});
