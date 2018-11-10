[![Travis CI Build Status](https://img.shields.io/travis/ExCiteS/airquality/master.svg)](https://travis-ci.org/ExCiteS/airquality)
[![Coveralls Test Coverage](https://img.shields.io/coveralls/ExCiteS/airquality/master.svg)](https://coveralls.io/r/ExCiteS/airquality)
[![Get it on Google Play](https://img.shields.io/badge/Google%20Play-download-ff69b3.svg)](https://play.google.com/store/apps/details?id=com.mfc.airquality)

# Air Quality

Air Quality is a hybrid [Cordova](https://cordova.apache.org) application for collecting measurements that is currently developed by [Mapping for Change](http://mappingforchange.org.uk), and is supporting the [GeoKey platform](http://geokey.org.uk) developed by [Extreme Citizen Science](http://ucl.ac.uk/excites) research group at University College London.

## Prerequisite

- Homebrew installed
- Node installed
- Yarn installed
- Java Development Kit (JDK)
- Android Studio

Air Quality requires the [geokey-airquality](https://github.com/ExCiteS/geokey-airquality) extension to be installed alongside [GeoKey](https://github.com/ExCiteS/geokey).

### Homebrew Installation

Install Homebrew using the official script:

```
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

### Node Installation

You can install Node directly with Homebrew:

```
brew install node
```

However, it is recommended to use Node Version Manager to enable easy updating and switching between versions.

There are multiple ways to install Node Version Manager, please follow [official guide](https://github.com/creationix/nvm).

After that, install Node itself:

```
nvm install node
```

Or if you wish to use long-term support (LTS) version:

```
nvm install node --lts
```

### Yarn Installation

Since you already have Homebrew installed, you might just use it to install Yarn:

```
brew install yarn --without-node
```

Flag `--without-node` tells Yarn not to install Node alongside (since you should already have it on a system).

### Java Development Kit (JDK) Installation

Install [Java Development Kit (JDK) 8](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html). Cordova also requires [Gradle to be installed](https://gradle.org/install/) too (e.g. using Homebrew).

If by running `java -version` you see anything else than "1.8" or you get other Java errors, try to set the path to required version by including `export JAVA_HOME=$(/usr/libexec/java_home -v 1.8)` in your `~/.bash_profile` (don't forget to reload with `source ~/.bash_profile`).

### Android Studio Installation

Install [Android Studio](https://developer.android.com/studio/index.html), then run the SDK Manager and install:

- SDK Platform for API 27
- latest Android SDK Platform-tools
- latest Android SDK Build-tools

Add the following exports to your `~/.bash_profile` (also reload with `source ~/.bash_profile`).

```
export ANDROID_SDK=$HOME/Library/Android/sdk
export PATH=$ANDROID_SDK/emulator:$ANDROID_SDK/tools:$PATH
```

Check the requirements to make sure the system is up and ready by running `yarn cordova requirements android`.

## Build Application

Navigate to project's directory and install required dependencies:

```console
yarn install
```

Copy configuration file from the sample:

```console
cp config.sample.js config.js
```

Edit application's configuration - add the URL of GeoKey platform used (without `/api/`), also client ID.

Build Angular application:

```console
yarn grunt
```

Download all the required Cordova platforms:

```console
yarn cordova platform add browser
yarn cordova platform add android
```

Build Air Quality application for all platforms:

```console
yarn cordova build --release
```

Or individual platforms:

```console
yarn cordova build --release browser
yarn cordova build --release android
```

### Sign Android APK

Get the release key from Mapping for Change (including instructions), copy it to your working directory.

Sign the app (you will need to enter the build passphrase):

```console
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore airquality-key.keystore platforms/android/build/outputs/apk/android-release-unsigned.apk alias_name
```

Locate the zipalign tool (usually inside `/path/to/Android/sdk/build-tools/<version>/zipalign`) and run the following:

```console
zipalign -v 4 platforms/android/build/outputs/apk/android-release-unsigned.apk air-quality.apk
```

For example, on macOS with Android SDK version 25.0.2, the command should be:

```console
~/Library/Android/sdk/build-tools/25.0.2/zipalign -v 4 platforms/android/build/outputs/apk/android-release-unsigned.apk air-quality.apk
```

The finalised signed app can then be uploaded to [Google Play Store](https://play.google.com/apps/publish/).

Please note, Cordova previously was adding additional "8" at the end of generated Android version code. This has changed in the later updates. Following the default settings, Google Play store will not allow to upload any *new* versions of the app, as they will all be treated as lower versions. A workaround was added, where Android version code *must be* explicitly set in the XML configuration file.

## Develop Application

When building Angular application, use:

```console
yarn grunt dev
```

Changes will be watched and applied when saving, all Cordova platforms will be recompiled also.

Don't forget to build Air Quality application:

```console
yarn cordova build
```

When Air Quality application is compiled, you can run each of the platform:

### Run "Browser" Platform

Start a local server:

```console
yarn start
```

Now you can access Air Quality using the `http://localhost:4060` URL from any browser on your local machine.

### Run "Android" Platform

To run on an emulator:

```console
yarn cordova run --emulator
```

Run `emulator -list-avds` to see all emulators you have created locally, `emulator @<emulator>` to run a specific emulator.

To run on an actual Android device, use:

```console
yarn cordova run android --target=<device>
```

Run `~/Library/Android/sdk/platform-tools/adb` to see all available Android devices.

## Run Unit Tests

All tests are written in [Jasmine](https://github.com/pivotal/jasmine).

Navigate to project's directory, build Angular application, then run:

```console
yarn test
```

You can pass custom arguments too, for example, `yarn test --no-single-run` will continue running tests after a change is being made to the files (either app or tests).

Coverage report is generated inside the `coverage` directory.
