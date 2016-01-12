module.exports = function (karma) {
  'use strict';

  karma.set({
    basePath: '.',

    frameworks: ['jasmine'],
    browsers: ['PhantomJS'],

    plugins: [
      'karma-jasmine',
      'karma-phantomjs-launcher',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-coverage'
    ],

    customLaunchers: {
      ChromeTravisCI: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },

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

    reporters: ['progress', 'coverage'],

    coverageReporter: {
      type: 'lcovonly',
      dir: 'coverage/',
      subdir: 'results/'
    },

    autoWatch: true,
    singleRun: true
  });
};
