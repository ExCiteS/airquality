# Air Quality

Air Quality is a mini [Cordova](https://cordova.apache.org) application for collecting measurements that is currently developed by [Mapping for Change](http://mappingforchange.org.uk), and is supporting the [GeoKey platform](http://geokey.org.uk) developed by [Extreme Citizen Science](http://ucl.ac.uk/excites) at the University College London.

## Requirements

Air Quality requires the [geokey-airquality](https://github.com/ExCiteS/geokey-airquality) extension to be installed alongside GeoKey.

## Build Application

Follow official documentation to [install Node.js](https://github.com/joyent/node/wiki/installation). You may need to install [Git](http://git-scm.com/downloads) and [Ruby](http://ruby-lang.org/en/installation) too.

Install Bower, Grunt's Command Line Interface and Cordova globally:

```console
sudo npm install -g bower
sudo npm install -g grunt-cli
sudo npm install -g cordova
```

Navigate to project's directory and install required Bower components and npm modules locally:

```console
bower install
npm install
```

Copy configuration file from the sample with `cp config.sample.js config.js`. Edit application's configuration and add the URL of GeoKey platform used (without `/api/`), also client's ID.

Build Angular application:

```console
grunt
```

Download all the required Cordova plugins:

```console
cordova plugin add cordova-plugin-dialogs
cordova plugin add cordova-plugin-network-information
cordova plugin add cordova-plugin-geolocation
```

Also, add platforms (SDK must be installed for each phone platform):

```console
cordova platform add browser
cordova platform add ios
cordova platform add android
```

Build Air Quality application for all platforms:

```console
cordova build
```

Or individual platforms:

```console
cordova build browser
cordova build ios
cordova build android
```

## Develop Application

When building Angular application, use:

```console
grunt dev
```

Changes will be watched and applied when saving.

When Air Quality application is compiled, test it on the emulator:

```console
cordova emulate <platform>
```

iOS requires ios-sim to be installed globally:

```console
sudo npm install -g ios-sim
```

Or connected device:
To test the app on the actual Android device, use:

```console
cordova run android --target=<device>
```

Run `adb devices` to see all available Android devices.
