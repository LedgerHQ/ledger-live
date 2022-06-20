// NOTE: It seems that we can't build the ios app in arm64 on M1
const iosArch = "x86_64";
// NOTE: Pass CI=1 if you want to build locally when you don't have a mac M1
const androidArch = process.env.CI ? "x86_64" : "arm64-v8a";

module.exports = {
  testRunner: "jest",
  runnerConfig: "e2e/config.json",
  specs: "e2e/specs",
  behavior: {
    // NOTE: https://github.com/wix/Detox/blob/master/docs/APIRef.Configuration.md#behavior-configuration
    init: {
      reinstallApp: true,
      exposeGlobals: true,
    },
    launchApp: "auto",
    cleanup: {
      shutdownDevice: !!process.env.CI,
    },
  },
  apps: {
    "ios.debug": {
      type: "ios.app",
      build: `export ENVFILE=.env.mock && xcodebuild ARCHS=${iosArch} ONLY_ACTIVE_ARCH=no -workspace ios/ledgerlivemobile.xcworkspace -scheme ledgerlivemobile -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build`,
      binaryPath:
        "ios/build/Build/Products/Debug-iphonesimulator/ledgerlivemobile.app",
    },
    /* FIXME: It's not building and I don't know why, the directory is present.
    ---
    Output:
    /usr/bin/codesign --force --sign - --timestamp\=none --generate-entitlement-der /Users/nabil.bourenane/Workspace/ledger-live/apps/ledger-live-mobile/ios/build/Build/Products/Staging-iphonesimulator/ledgerlivemobile.app/PlugIns/ledgerlivemobileTests.xctest
    /Users/nabil.bourenane/Workspace/ledger-live/apps/ledger-live-mobile/ios/build/Build/Products/Staging-iphonesimulator/ledgerlivemobile.app/PlugIns/ledgerlivemobileTests.xctest: No such file or directory
    Command CodeSign failed with a nonzero exit code
    ---
    "ios.release": {
      type: "ios.app",
      build: `export RCT_NO_LAUNCH_PACKAGER=true && export ENVFILE=.env.mock && xcodebuild ARCHS=${iosArch} ONLY_ACTIVE_ARCH=no -workspace ios/ledgerlivemobile.xcworkspace -scheme ledgerlivemobile -configuration Staging -sdk iphonesimulator -derivedDataPath ios/build`,
      binaryPath:
        "ios/build/Build/Products/Debug-iphonesimulator/ledgerlivemobile.app",
      // "launchArgs": "https://github.com/wix/Detox/blob/master/docs/APIRef.LaunchArgs.md",
    },
    */
    "android.debug": {
      type: "android.apk",
      build:
        "cd android && ENVFILE=.env.mock ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && cd ..",
      binaryPath: `android/app/build/outputs/apk/debug/app-${androidArch}-debug.apk`,
      testBinaryPath:
        "android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk",
    },
    "android.release": {
      type: "android.apk",
      build:
        "cd android && ENVFILE=.env.mock ./gradlew assembleStagingRelease assembleAndroidTest -DtestBuildType=stagingRelease && cd ..",
      binaryPath: `android/app/build/outputs/apk/stagingRelease/app-${androidArch}-stagingRelease.apk`,
      testBinaryPath:
        "android/app/build/outputs/apk/androidTest/stagingRelease/app-stagingRelease-androidTest.apk",
      // "launchArgs": "https://github.com/wix/Detox/blob/master/docs/APIRef.LaunchArgs.md",
    },
  },
  devices: {
    simulator: {
      type: "ios.simulator",
      device: {
        type: "iPhone 11 Pro",
        os: "iOS 15.5",
      },
      // bootArgs: "https://github.com/wix/Detox/blob/master/docs/APIRef.Configuration.md",
    },
    emulator: {
      type: "android.emulator",
      device: {
        avdName: "Nexus_6_API_30",
      },
      // bootArgs: "https://github.com/wix/Detox/blob/master/docs/APIRef.Configuration.md",
    },
  },
  configurations: {
    "ios.sim.debug": {
      device: "simulator",
      app: "ios.debug",
      // artifacts: { https://github.com/wix/Detox/blob/master/docs/APIRef.Configuration.md#artifacts-configuration },
    },
    "ios.sim.release": {
      device: "simulator",
      app: "ios.release",
      // artifacts: { https://github.com/wix/Detox/blob/master/docs/APIRef.Configuration.md#artifacts-configuration },
    },
    "android.emu.debug": {
      device: "emulator",
      app: "android.debug",
      // artifacts: { https://github.com/wix/Detox/blob/master/docs/APIRef.Configuration.md#artifacts-configuration },
    },
    "android.emu.release": {
      device: "emulator",
      app: "android.release",
      // artifacts: { https://github.com/wix/Detox/blob/master/docs/APIRef.Configuration.md#artifacts-configuration },
    },
  },
};
