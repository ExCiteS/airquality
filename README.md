# Air Quality

Air Quality is a mini web application for collecting measurements that is currently developed by [Mapping for Change](http://mappingforchange.org.uk), and is supporting the [GeoKey platform](http://geokey.org.uk) developed by [Extreme Citizen Science Research Group](http://ucl.ac.uk/excites) at University College London.

## Requirements

Air Quality requires the [geokey-airquality](https://github.com/ExCiteS/geokey-airquality) extension to be installed alongside GeoKey.

## Build Application

1. [Install Node.js](https://github.com/joyent/node/wiki/installation) [1]
2. Install Bower globally with `sudo npm install -g bower`
3. Install Grunt's Command Line Interface with `sudo npm install -g grunt-cli`
4. Navigate to project's directory
5. Run `npm install` to download required modules [2]
6. Run `bower install` to download required components [3]
7. Copy configuration file from the sample with `cp config.sample.js config.js`
8. Edit application's configuration and add the URL of GeoKey platform (without `/api/`), also client's ID
9. Run `grunt build`[4] from main directory to build Air Quality web application

NOTES:

[1] You may need to install [Git](http://git-scm.com/downloads) and [Ruby](http://ruby-lang.org/en/installation) too.

[2] To check for the newer versions of npm modules, install [npm-check-updates](https://github.com/tjunnone/npm-check-updates) globally with `sudo npm install -g npm-check-updates`, then run `ncu` form the main project's directory.

[3] To check for the newer versions of Bower components, run `bower list` form the main project's directory.

[4] Use `grunt dev` for developing: app files are not minified, also changes are watched and applied when saving.
