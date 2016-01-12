module.exports = function (grunt) {
  'use strict';

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: {
      www: ['www'],
      temp: ['temp']
    },

    copy: {
      html: {
        expand: true,
        dot: true,
        cwd: 'temp/html',
        src: '{,*/}*.html',
        dest: 'www'
      },

      css: {
        expand: true,
        dot: true,
        cwd: 'temp/css',
        src: '{,*/}*.css',
        dest: 'www/stylesheets'
      },

      js: {
        expand: true,
        dot: true,
        cwd: 'temp/js',
        src: '{,*/}*.js',
        dest: 'www/scripts'
      },

      images: {
        expand: true,
        dot: true,
        cwd: 'temp/images',
        src: '{,*/}*.{png,jpg,jpeg,gif,svg}',
        dest: 'www/images'
      }
    },

    html2js: {
      app: {
        src: [
          'app/templates/partials/**/*.html',
        ],
        dest: 'temp/js/templates.js'
      },

      options: {
        base: 'app/templates',
        module: 'templates',
        htmlmin: {
          conservativeCollapse: true,
          collapseWhitespace: true,
          removeComments: true,
          removeOptionalTags: true
        }
      }
    },

    less: {
      app: {
        files: {
          'temp/css/app.css': ['app/stylesheets/app.less']
        }
      }
    },

    cssmin: {
      vendor: {
        files: {
          'temp/css/vendor.css': [
            'bower_components/leaflet/dist/leaflet.css',
            'bower_components/bootstrap/dist/css/bootstrap.css'
          ]
        }
      }
    },

    imagemin: {
      app: {
        files: [{
          expand: true,
          cwd: 'app/images',
          src: '{,*/}*.{png,jpg,jpeg,gif,svg}',
          dest: 'temp/images'
        }]
      }
    },

    concat: {
      vendor: {
        src: [
          'bower_components/lodash/lodash.js',
          'bower_components/leaflet/dist/leaflet.js',
          'bower_components/moment/moment.js',
          'bower_components/angular/angular.js',
          'bower_components/angular-sanitize/angular-sanitize.js',
          'bower_components/angular-touch/angular-touch.js',
          'bower_components/angular-moment/angular-moment.js',
          'bower_components/angular-ui-router/release/angular-ui-router.js',
          'node_modules/opbeat-js/dist/1/angular-opbeat.min.js'
        ],
        dest: 'temp/js/vendor.js'
      },

      app: {
        src: [
          'app/scripts/AppInit.js',
          'app/scripts/{,*/}*.js',
          'config.js'
        ],
        dest: 'temp/js/app.js'
      },

      options: {
        stripBanners: true
      }
    },

    replace: {
      version: {
        files: [{
            src: ['app/templates/index.html'],
            dest: 'temp/html/index.html'
          },

          {
            src: ['temp/js/app.js'],
            dest: 'temp/js/app.js'
          }
        ],

        options: {
          patterns: [{
            match: 'version',
            replacement: '<%= pkg.version %>'
          }]
        }
      }
    },

    jshint: {
      app: ['config.js', 'app/scripts/**/*.js'],

      options: {
        jshintrc: '.jshintrc'
      }
    },

    watch: {
      templates: {
        files: ['app/templates/**/*.html'],
        tasks: [
          'html2js',
          'replace',
          'copy:html',
          'copy:js'
        ]
      },

      stylesheets: {
        files: ['app/stylesheets/{,*/}*.less'],
        tasks: [
          'less',
          'copy:css'
        ]
      },

      scripts: {
        files: ['config.js', 'app/scripts/{,*/}*.js'],
        tasks: [
          'concat:app',
          'copy:js'
        ]
      },

      images: {
        files: ['app/images/{,*/}*.{png,jpg,jpeg,gif}'],
        tasks: [
          'imagemin',
          'copy:images'
        ]
      },

      options: {
        spawn: false
      }
    },

    coveralls: {
      app: {
        src: 'coverage/results/lcov.info'
      },

      options: {
        force: true
      }
    }
  });

  grunt.registerTask('default', [
    'jshint',
    'clean:temp',
    'less',
    'html2js',
    'cssmin',
    'imagemin',
    'concat',
    'replace',
    'clean:www',
    'copy',
    'clean:temp'
  ]);

  grunt.registerTask('dev', [
    'default',
    'watch'
  ]);
};
