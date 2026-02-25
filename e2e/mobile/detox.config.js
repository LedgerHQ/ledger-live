const path = require("path");
const iosArch = "arm64";
// NOTE: Pass CI=1 if you want to build locally when you don't have a mac M1. This works better if you do export CI=1 for the whole session.
const androidArch = process.env.CI ? "x86_64" : "arm64-v8a";
const SCHEME = "ledgerlivemobile";

const rootDir = path.resolve(__dirname, "../..");
const iosDir = path.join(rootDir, "apps/ledger-live-mobile/ios");
const iosBuildDir = path.join(iosDir, "build");
const androidDir = path.join(rootDir, "apps/ledger-live-mobile/android");
const ENV_FILE_MOCK = path.join("apps", "ledger-live-mobile", ".env.mock");
const ENV_FILE_MOCK_PRERELEASE = path.join("apps", "ledger-live-mobile", ".env.mock.prerelease");

const getIosBinary = config =>
  path.join(iosBuildDir, `Build/Products/${config}-iphonesimulator/${SCHEME}.app`);
const getAndroidBinary = type =>
  path.join(androidDir, `app/build/outputs/apk/${type}/app-${androidArch}-${type}.apk`);
const getAndroidTestBinary = type =>
  path.join(androidDir, `app/build/outputs/apk/androidTest/${type}/app-${type}-androidTest.apk`);

/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    $0: "jest",
    args: {
      config: "jest.config.ts",
    },
    jest: {
      setupTimeout: 500000,
      teardownTimeout: 120000,
    },
    noRetryArgs: ["json", "outputFile"],
    retries: 0,
    forwardEnv: true, // Used to forward DETOX_CONFIGURATION to Jest workers
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
      shutdownDevice: false,
    },
    extends: "detox-allure2-adapter/preset-detox",
  },
  apps: {
    "ios.debug": {
      type: "ios.app",
      build: `export ENVFILE=${ENV_FILE_MOCK} && xcodebuild ARCHS=${iosArch} ONLY_ACTIVE_ARCH=YES -workspace ios/ledgerlivemobile.xcworkspace -scheme ledgerlivemobile -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build`,
      binaryPath: getIosBinary("Debug"),
    },
    "ios.staging": {
      type: "ios.app",
      build: `export ENVFILE=${ENV_FILE_MOCK} && xcodebuild ARCHS=${iosArch} ONLY_ACTIVE_ARCH=YES -workspace ios/ledgerlivemobile.xcworkspace -scheme ledgerlivemobile -configuration Staging -sdk iphonesimulator -derivedDataPath ios/build`,
      binaryPath: getIosBinary("Staging"),
    },
    "ios.release": {
      type: "ios.app",
      build: `export ENVFILE=${ENV_FILE_MOCK} && xcodebuild ARCHS=${iosArch} ONLY_ACTIVE_ARCH=YES -workspace ios/ledgerlivemobile.xcworkspace -scheme ledgerlivemobile -configuration Release -sdk iphonesimulator -derivedDataPath ios/build`,
      binaryPath: getIosBinary("Release"),
    },
    "ios.prerelease": {
      type: "ios.app",
      build: `export ENVFILE=${ENV_FILE_MOCK_PRERELEASE} && xcodebuild ARCHS=${iosArch} ONLY_ACTIVE_ARCH=YES -workspace ios/ledgerlivemobile.xcworkspace -scheme ledgerlivemobile -configuration Release -sdk iphonesimulator -derivedDataPath ios/build`,
      binaryPath: getIosBinary("Release"),
    },
    "android.debug": {
      type: "android.apk",
      build: `cd android && ENVFILE=${ENV_FILE_MOCK} SENTRY_DISABLE_AUTO_UPLOAD=true ./gradlew app:assembleDebug app:assembleAndroidTest -DtestBuildType=debug -PreactNativeArchitectures=${androidArch} && cd ..`,
      binaryPath: getAndroidBinary("debug"),
      testBinaryPath: getAndroidTestBinary("debug"),
    },
    "android.release": {
      type: "android.apk",
      build: `cd android && ENVFILE=${ENV_FILE_MOCK} SENTRY_DISABLE_AUTO_UPLOAD=true ./gradlew app:assembleDetox app:assembleAndroidTest -DtestBuildType=detox -PreactNativeArchitectures=${androidArch} && cd ..`,
      binaryPath: getAndroidBinary("detox"),
      testBinaryPath: getAndroidTestBinary("detox"),
    },
    "android.prerelease": {
      type: "android.apk",
      build: `cd android && ENVFILE=${ENV_FILE_MOCK_PRERELEASE} SENTRY_DISABLE_AUTO_UPLOAD=true ./gradlew app:assembleDetoxPreRelease app:assembleAndroidTest -DtestBuildType=detoxPreRelease -PreactNativeArchitectures=${androidArch} && cd ..`,
      binaryPath: getAndroidBinary("detoxPreRelease"),
      testBinaryPath: getAndroidTestBinary("detoxPreRelease"),
    },
  },
  devices: {
    simulator: {
      type: "ios.simulator",
      device: {
        name: "iOS Simulator",
      },
    },
    simulator2: {
      type: "ios.simulator",
      device: {
        name: "iOS Simulator 2",
      },
    },
    simulator3: {
      type: "ios.simulator",
      device: {
        name: "iOS Simulator 3",
      },
    },
    emulator: {
      type: "android.emulator",
      device: {
        avdName: "Android_Emulator",
      },
      gpuMode: "swiftshader_indirect",
      headless: !!process.env.CI,
    },
    emulator2: {
      type: "android.emulator",
      device: {
        avdName: "Android_Emulator_2",
      },
      gpuMode: "swiftshader_indirect",
      headless: !!process.env.CI,
    },
    emulator3: {
      type: "android.emulator",
      device: {
        avdName: "Android_Emulator_3",
      },
      gpuMode: "swiftshader_indirect",
      headless: !!process.env.CI,
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
