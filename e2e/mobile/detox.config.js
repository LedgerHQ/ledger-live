const gpuMode = process.env.CI ? "swiftshader" : "host";
const {
  iosBinaryPath,
  androidBinaryPath,
  androidTestBinaryPath,
} = require("./scripts/e2e-binaries.cjs");

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
    "ios.debug": { type: "ios.app", binaryPath: iosBinaryPath("Debug") },
    "ios.staging": { type: "ios.app", binaryPath: iosBinaryPath("Staging") },
    "ios.release": { type: "ios.app", binaryPath: iosBinaryPath("Release") },
    "ios.prerelease": { type: "ios.app", binaryPath: iosBinaryPath("Release") },
    "android.debug": {
      type: "android.apk",
      binaryPath: androidBinaryPath("debug"),
      testBinaryPath: androidTestBinaryPath("debug"),
    },
    "android.release": {
      type: "android.apk",
      binaryPath: androidBinaryPath("detox"),
      testBinaryPath: androidTestBinaryPath("detox"),
    },
    "android.prerelease": {
      type: "android.apk",
      binaryPath: androidBinaryPath("detoxPreRelease"),
      testBinaryPath: androidTestBinaryPath("detoxPreRelease"),
    },
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
