// NOTE: It seems that we can't build the ios app in arm64 on M1
const iosArch = "x86_64";
// NOTE: Pass CI=1 if you want to build locally when you don't have a mac M1. This works better if you do export CI=1 for the whole session.
const androidArch = process.env.CI ? "x86_64" : "arm64-v8a";

/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    $0: "ts-jest",
    args: {
      config: "e2e/jest.config.js",
    },
    jest: {
      setupTimeout: 500000,
    },
    retries: 0,
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
      build: `export ENVFILE=.env.mock && xcodebuild ARCHS=${iosArch} ONLY_ACTIVE_ARCH=no -workspace ios/ledgerlivemobile.xcworkspace -scheme ledgerlivemobile -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build`,
      binaryPath: "ios/build/Build/Products/Debug-iphonesimulator/ledgerlivemobile.app",
    },
    "ios.staging": {
      type: "ios.app",
      build: `export ENVFILE=.env.mock && xcodebuild ARCHS=${iosArch} ONLY_ACTIVE_ARCH=no -workspace ios/ledgerlivemobile.xcworkspace -scheme ledgerlivemobile -configuration Staging -sdk iphonesimulator -derivedDataPath ios/build`,
      binaryPath: "ios/build/Build/Products/Staging-iphonesimulator/ledgerlivemobile.app",
    },
    "ios.release": {
      type: "ios.app",
      build: `export ENVFILE=.env.mock && xcodebuild ARCHS=${iosArch} ONLY_ACTIVE_ARCH=no -workspace ios/ledgerlivemobile.xcworkspace -scheme ledgerlivemobile -configuration Release -sdk iphonesimulator -derivedDataPath ios/build`,
      binaryPath: "ios/build/Build/Products/Release-iphonesimulator/ledgerlivemobile.app",
    },
    "android.debug": {
      type: "android.apk",
      build:
        "cd android && ENVFILE=.env.mock ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && cd ..",
      binaryPath: `android/app/build/outputs/apk/debug/app-${androidArch}-debug.apk`,
      testBinaryPath: "android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk",
    },
    "android.release": {
      type: "android.apk",
      build:
        "cd android && ENVFILE=.env.mock ./gradlew assembleStagingRelease assembleAndroidTest -DtestBuildType=stagingRelease && cd ..",
      binaryPath: `android/app/build/outputs/apk/stagingRelease/app-${androidArch}-stagingRelease.apk`,
      testBinaryPath:
        "android/app/build/outputs/apk/androidTest/stagingRelease/app-stagingRelease-androidTest.apk",
    },
  },
  devices: {
    simulator: {
      type: "ios.simulator",
      device: {
        type: "iPhone 14",
      },
    },
    emulator: {
      type: "android.emulator",
      device: {
        avdName: "Pixel_6_Pro_API_32",
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
    "android.emu.debug": {
      device: "emulator",
      app: "android.debug",
    },
    "android.emu.release": {
      device: "emulator",
      app: "android.release",
    },
  },
};
