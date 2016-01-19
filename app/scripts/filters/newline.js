/**
 * @ngdoc filter
 * @name AQ.filter:newline
 * @function
 *
 * @description
 * Converts newline symbols to appropriate HTML line breaks.
 *
 * @param {String} input Text with possible newlines.
 * @returns {String} Converted text.
 */
AQ.filter('newline', function () {
  'use strict';

  return function (input) {
    if (_.isString(input)) {
      input = input.replace(/\n/g, '<br />');
    }

    return input;
  };
});
