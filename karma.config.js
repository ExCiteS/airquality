module.exports = function (karma) {
  'use strict';

  karma.set({
    basePath: '.',

    frameworks: ['jasmine'],
    browsers: ['PhantomJS'],

    plugins: [
      'karma-jasmine',
      'karma-phantomjs-launcher',
      'karma-coverage'
    ],

    preprocessors: {
      'app/scripts/{,*/}*.js': ['coverage']
    },

    files: [
      'www/scripts/vendor.js',
      'www/scripts/templates.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'node_modules/es5-shim/es5-shim.js',
      'app/scripts/**/*.js',
      'config.js',
      'tests/{,*/}*.js'
    ],

    proxies: {
      '/images/': 'www/images/'
    },

    reporters: ['progress', 'coverage', 'coveralls'],

    coverageReporter: {
      type: 'lcov',
      dir: 'coverage/'
    },

    autoWatch: true,
    singleRun: true
  });
};
