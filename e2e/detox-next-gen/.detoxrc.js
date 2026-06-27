const path = require("path");
const iosArch = "arm64";
// NOTE: Pass CI=1 if you want to build locally when you don't have a mac M1. This works better if you do export CI=1 for the whole session.
const androidArch = process.env.CI ? "x86_64" : "arm64-v8a";
const gpuMode = process.env.CI ? "swiftshader_indirect" : "host";
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
    args: {
      $0: "jest",
      config: "jest.config.js",
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  logger: {
    level: "info",
  },
  behavior: {
    // Don't reinstall the .app between specs — the bridge resets state.
    // Flip to `true` if a spec mutates native storage in a way the bridge
    // can't undo (rare).
    init: { exposeGlobals: false },
    launchApp: "auto",
    // Reuse the booted simulator across specs and across runs locally.
    cleanup: { shutdownDevice: false },
  },
  apps: {
    "ios.debug": {
      type: "ios.app",
      binaryPath: getIosBinary("Debug"),
      build: `xcodebuild -workspace ios/${SCHEME}.xcworkspace -scheme ${SCHEME} -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build`,
    },
    "ios.release": {
      type: "ios.app",
      binaryPath: getIosBinary("Release"),
      build: `export ENVFILE=${ENV_FILE_MOCK} && xcodebuild ARCHS=${iosArch} ONLY_ACTIVE_ARCH=YES -workspace ios/${SCHEME}.xcworkspace -scheme ${SCHEME} -configuration Release -sdk iphonesimulator -derivedDataPath ios/build`,
    },
    "android.debug": {
      type: "android.apk",
      binaryPath: getAndroidBinary("debug"),
      build: "cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug",
      reversePorts: [8081],
    },
    "android.release": {
      type: "android.apk",
      binaryPath: getAndroidBinary("release"),
      build: "cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release",
    },
  },
  devices: {
    simulator: {
      type: "ios.simulator",
      device: {
        name: "iOS Simulator",
      },
    },
    attached: {
      type: "android.attached",
      device: {
        adbName: ".*",
      },
    },
    emulator: {
      type: "android.emulator",
      device: {
        avdName: "Pixel_3a_API_30_x86",
      },
    },
  },
  configurations: {
    "ios.sim.debug": {
      device: "simulator",
      app: "ios.debug",
    },
    "ios.sim.release": {
      device: "simulator",
      app: "ios.release",
    },
    "android.att.debug": {
      device: "attached",
      app: "android.debug",
    },
    "android.att.release": {
      device: "attached",
      app: "android.release",
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
