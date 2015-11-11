'use strict';

AQ.filter('active', function () {
  return function (locations) {
    var activeOnly = [];

    if (_.isArray(locations)) {
      _.each(locations, function (location) {
        // Do not include deleted locations
        if (!location.deleted) {
          activeOnly.push(location);
        }
      });
    }

    return activeOnly;
  };
});
