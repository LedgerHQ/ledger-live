const iosArch = "arm64";
// NOTE: Pass CI=1 if you want to build locally when you don't have a mac M1. This works better if you do export CI=1 for the whole session.
const androidArch = process.env.CI ? "x86_64" : "arm64-v8a";

/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    $0: "jest",
    args: {
      config: "e2e/jest.config.js",
    },
    jest: {
      setupTimeout: 500000,
    },
    retries: process.env.CI ? 2 : 0,
  },
  logger: {
    level: process.env.DEBUG_DETOX ? "trace" : "info",
  },
  behavior: {
    // NOTE: https://github.com/wix/Detox/blob/master/docs/APIRef.Configuration.md#behavior-configuration
    init: {
      reinstallApp: true,
      exposeGlobals: false,
    },
    launchApp: "auto",
    cleanup: {
      shutdownDevice: process.env.CI ? true : false,
    },
  },
  apps: {
    "ios.debug": {
      type: "ios.app",
      build: `export ENVFILE=.env.mock && xcodebuild ARCHS=${iosArch} ONLY_ACTIVE_ARCH=YES -workspace ios/ledgerlivemobile.xcworkspace -scheme ledgerlivemobile -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build`,
      binaryPath: "ios/build/Build/Products/Debug-iphonesimulator/ledgerlivemobile.app",
    },
    "ios.staging": {
      type: "ios.app",
      build: `export ENVFILE=.env.mock && xcodebuild ARCHS=${iosArch} ONLY_ACTIVE_ARCH=YES -workspace ios/ledgerlivemobile.xcworkspace -scheme ledgerlivemobile -configuration Staging -sdk iphonesimulator -derivedDataPath ios/build`,
      binaryPath: "ios/build/Build/Products/Staging-iphonesimulator/ledgerlivemobile.app",
    },
    "ios.release": {
      type: "ios.app",
      build: `export ENVFILE=.env.mock && xcodebuild ARCHS=${iosArch} ONLY_ACTIVE_ARCH=YES -workspace ios/ledgerlivemobile.xcworkspace -scheme ledgerlivemobile -configuration Release -sdk iphonesimulator -derivedDataPath ios/build`,
      binaryPath: "ios/build/Build/Products/Release-iphonesimulator/ledgerlivemobile.app",
    },
    "ios.prerelease": {
      type: "ios.app",
      build: `export ENVFILE=.env.mock.prerelease && xcodebuild ARCHS=${iosArch} ONLY_ACTIVE_ARCH=YES -workspace ios/ledgerlivemobile.xcworkspace -scheme ledgerlivemobile -configuration Release -sdk iphonesimulator -derivedDataPath ios/build`,
      binaryPath: "ios/build/Build/Products/Release-iphonesimulator/ledgerlivemobile.app",
    },
    "android.debug": {
      type: "android.apk",
      build: `cd android && ENVFILE=.env.mock ./gradlew app:assembleDebug app:assembleAndroidTest -DtestBuildType=debug -PreactNativeArchitectures=${androidArch} && cd ..`,
      binaryPath: `android/app/build/outputs/apk/debug/app-${androidArch}-debug.apk`,
      testBinaryPath: "android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk",
    },
    "android.release": {
      type: "android.apk",
      build: `cd android && ENVFILE=.env.mock ./gradlew app:assembleDetox app:assembleAndroidTest -DtestBuildType=detox -PreactNativeArchitectures=${androidArch} && cd ..`,
      binaryPath: `android/app/build/outputs/apk/detox/app-${androidArch}-detox.apk`,
      testBinaryPath: "android/app/build/outputs/apk/androidTest/detox/app-detox-androidTest.apk",
    },
    "android.prerelease": {
      type: "android.apk",
      build: `cd android && ENVFILE=.env.mock.prerelease ./gradlew app:assembleDetoxPreRelease app:assembleAndroidTest -DtestBuildType=detoxPreRelease -PreactNativeArchitectures=${androidArch} && cd ..`,
      binaryPath: `android/app/build/outputs/apk/detoxPreRelease/app-${androidArch}-detoxPreRelease.apk`,
      testBinaryPath:
        "android/app/build/outputs/apk/androidTest/detoxPreRelease/app-detoxPreRelease-androidTest.apk",
    },
  },
  devices: {
    simulator: {
      type: "ios.simulator",
      device: {
        name: "iOS Simulator",
      },
    },
    emulator: {
      type: "android.emulator",
      device: {
        avdName: "Android_Emulator",
      },
      gpuMode: "swiftshader_indirect",
      headless: process.env.CI ? true : false,
    },
  },
  configurations: {
    "ios.sim.debug": {
      device: "simulator",
      app: "ios.debug",
      // artifacts: { https://github.com/wix/Detox/blob/master/docs/APIRef.Configuration.md#artifacts-configuration },
    },
    "ios.sim.staging": {
      device: "simulator",
      app: "ios.staging",
    },
    "ios.sim.release": {
      device: "simulator",
      app: "ios.release",
    },
    "ios.sim.prerelease": {
      device: "simulator",
      app: "ios.prerelease",
    },
    "android.emu.debug": {
      device: "emulator",
      app: "android.debug",
    },
    "android.emu.release": {
      device: "emulator",
      app: "android.release",
    },
    "android.emu.prerelease": {
      device: "emulator",
      app: "android.prerelease",
    },
  },
};
