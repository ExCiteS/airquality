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
            'node_modules/leaflet/dist/leaflet.css',
            'node_modules/bootstrap/dist/css/bootstrap.css'
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
          'node_modules/leaflet/dist/leaflet.js',
          'node_modules/moment/moment.js',
          'node_modules/angular/angular.js',
          'node_modules/angular-sanitize/angular-sanitize.js',
          'node_modules/angular-touch/angular-touch.js',
          'node_modules/angular-moment/angular-moment.js',
          'node_modules/@uirouter/angularjs/release/angular-ui-router.js'
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

    exec: {
      release: {
        command: 'yarn cordova build --release'
      },

      dev: {
        command: 'yarn cordova build'
      }
    },

    watch: {
      templates: {
        files: ['app/templates/**/*.html'],
        tasks: [
          'html2js',
          'replace',
          'copy:html',
          'copy:js',
          'exec:dev'
        ]
      },

      stylesheets: {
        files: ['app/stylesheets/{,*/}*.less'],
        tasks: [
          'less',
          'copy:css',
          'exec:dev'
        ]
      },

      scripts: {
        files: ['config.js', 'app/scripts/{,*/}*.js'],
        tasks: [
          'concat:app',
          'copy:js',
          'exec:dev'
        ]
      },

      images: {
        files: ['app/images/{,*/}*.{png,jpg,jpeg,gif}'],
        tasks: [
          'imagemin',
          'copy:images',
          'exec:dev'
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
