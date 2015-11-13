'use strict';

/**
 * @ngdoc filter
 * @name AQ.filter:active
 * @function
 *
 * @description
 * Excludes deleted items from the list.
 *
 * @param {Array} items Original list of items.
 * @returns {Array} List without deleted items.
 */
AQ.filter('active', function () {
  return function (items) {
    var activeOnly = [];

    if (_.isArray(items)) {
      _.each(items, function (item) {
        if (!item.deleted) {
          activeOnly.push(item);
        }
      });
    }

    return activeOnly;
  };
});
