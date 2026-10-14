const os = require("os");
const path = require("path");
const syncAppVersion = platform =>
  `node ${path.join(__dirname, "scripts", "syncAppVersion.js")} ${platform}`;

const iosArch = "arm64";
// Host-keyed so an inherited CI variable cannot select the wrong ABI. Override: E2E_ANDROID_ABI.
// process.arch is "x64" under Rosetta; os.cpus() still reports the host's "Apple ..." brand string.
const isAppleSiliconHost =
  process.platform === "darwin" &&
  (process.arch === "arm64" || (os.cpus()[0]?.model ?? "").startsWith("Apple"));
const androidArch = process.env.E2E_ANDROID_ABI || (isAppleSiliconHost ? "arm64-v8a" : "x86_64");
const gpuMode = process.env.CI ? "swiftshader_indirect" : "host";
const SCHEME = "ledgerlivemobile";

const rootDir = path.resolve(__dirname, "../..");
const iosDir = path.join(rootDir, "apps/ledger-live-mobile/ios");
const iosBuildDir = path.join(iosDir, "build");
const androidDir = path.join(rootDir, "apps/ledger-live-mobile/android");
const MOCK_ENV = path.join(rootDir, "apps", "ledger-live-mobile", ".env.mock");
const MOCK_ENV_PRERELEASE = path.join(
  rootDir,
  "apps",
  "ledger-live-mobile",
  ".env.mock.prerelease",
);

const getIosBinary = config =>
  path.join(iosBuildDir, `Build/Products/${config}-iphonesimulator/${SCHEME}.app`);
const getAndroidBinary = type =>
  path.join(androidDir, `app/build/outputs/apk/${type}/app-${androidArch}-${type}.apk`);
const getAndroidTestBinary = type =>
  path.join(androidDir, `app/build/outputs/apk/androidTest/${type}/app-${type}-androidTest.apk`);

const buildIos = (envFile, configuration) => ({
  type: "ios.app",
  build: `${syncAppVersion("ios")} && export ENVFILE=${envFile} && xcodebuild ARCHS=${iosArch} ONLY_ACTIVE_ARCH=YES -workspace ios/ledgerlivemobile.xcworkspace -scheme ledgerlivemobile -configuration ${configuration} -sdk iphonesimulator -derivedDataPath ios/build`,
  binaryPath: getIosBinary(configuration),
});

const buildAndroid = (envFile, gradleTaskSuffix, testBuildType) => ({
  type: "android.apk",
  build: `${syncAppVersion("android")} && cd android && ENVFILE=${envFile} ./gradlew app:assemble${gradleTaskSuffix} app:assembleAndroidTest -DtestBuildType=${testBuildType} -PreactNativeArchitectures=${androidArch} && cd ..`,
  binaryPath: getAndroidBinary(testBuildType),
  testBinaryPath: getAndroidTestBinary(testBuildType),
});

const DEFAULT_RETRIES = 0;
// Detox requires a finite number, so anything unparseable falls back to the default. 0 is valid.
const parseRetries = value => {
  const raw = (value ?? "").trim();
  const parsed = Number(raw);
  return raw && Number.isInteger(parsed) && parsed >= 0 ? parsed : DEFAULT_RETRIES;
};

/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    $0: "jest",
    args: {
      config: "jest.config.js",
    },
    jest: {
      setupTimeout: 500000,
      teardownTimeout: 120000,
    },
    noRetryArgs: ["json", "outputFile"],
    // Local default. CI passes --retries on the CLI, which takes precedence.
    retries: parseRetries(process.env.E2E_RETRIES),
    forwardEnv: true, // Used to forward DETOX_CONFIGURATION to Jest workers
  },
  logger: {
    level: process.env.DEBUG_DETOX ? "trace" : "info",
  },
  session: {
    // Only governs how long Detox waits before printing "The app is busy with: <resources>", which
    // is the most useful clue when a wait never resolves. 10s is what was in force while this key
    // sat under `behavior`, where Detox does not read it.
    debugSynchronization: 10000,
  },
  // Specified in full rather than inherited from detox-allure2-adapter/preset-detox: `pnpm mobile
  // e2e:build` installs only the app's dependencies, and that preset belongs to this package, so
  // extending it fails the Detox build. It only ever contributed these same five plugins.
  artifacts: {
    rootDir: "artifacts",
    plugins: {
      log: "failing",
      screenshot: "failing",
      video: "none",
      instruments: "none",
      // jest.environment.ts already captures a hierarchy on failure; the preset captured one per test.
      uiHierarchy: "disabled",
    },
  },
  behavior: {
    // NOTE: https://github.com/wix/Detox/blob/master/docs/APIRef.Configuration.md#behavior-configuration
    init: {
      reinstallApp: false,
      exposeGlobals: false,
    },
    launchApp: "auto",
    cleanup: {
      shutdownDevice: false,
    },
  },
  apps: {
    "ios.debug": buildIos(MOCK_ENV, "Debug"),
    "ios.staging": buildIos(MOCK_ENV, "Staging"),
    "ios.release": buildIos(MOCK_ENV, "Release"),
    "ios.prerelease": buildIos(MOCK_ENV_PRERELEASE, "Release"),
    "android.debug": buildAndroid(MOCK_ENV, "Debug", "debug"),
    "android.release": buildAndroid(MOCK_ENV, "Detox", "detox"),
    "android.prerelease": buildAndroid(MOCK_ENV_PRERELEASE, "DetoxPreRelease", "detoxPreRelease"),
  },
  // jest.environment.ts resolves `${configuration.device}${JEST_WORKER_ID}` for every extra Jest
  // worker and throws if the alias is absent; they must cover jest.config.js maxWorkers (3 on CI).
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
      gpuMode,
      headless: !!process.env.CI,
    },
    emulator2: {
      type: "android.emulator",
      device: {
        avdName: "Android_Emulator_2",
      },
      gpuMode,
      headless: !!process.env.CI,
    },
    emulator3: {
      type: "android.emulator",
      device: {
        avdName: "Android_Emulator_3",
      },
      gpuMode,
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
