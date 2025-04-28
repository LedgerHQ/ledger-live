const path = require("path");

const iosArch = "arm64";
const androidArch = process.env.CI ? "x86_64" : "arm64-v8a";
const ENV_FILE_MOCK = path.join("apps", "ledger-live-mobile", ".env.mock");
const ENV_FILE_MOCK_PRERELEASE = path.join("apps", "ledger-live-mobile", ".env.mock.prerelease");
const SCHEME = "ledgerlivemobile";
const ANDROID_ASSEMBLE_TEST = "app:assembleAndroidTest";

const rootDir = path.resolve(__dirname, "../..");
const iosDir = path.join(rootDir, "apps/ledger-live-mobile/ios");
const iosBuildDir = path.join(iosDir, "build");
const androidDir = path.join(rootDir, "apps/ledger-live-mobile/android");

const getIosBinary = config =>
  path.join(iosBuildDir, `Build/Products/${config}-iphonesimulator/${SCHEME}.app`);
const getAndroidBinary = type =>
  path.join(androidDir, `app/build/outputs/apk/${type}/app-${androidArch}-${type}.apk`);
const getAndroidTestBinary = type =>
  path.join(androidDir, `app/build/outputs/apk/androidTest/${type}/app-${type}-androidTest.apk`);

const getIosBuildCommand = (configuration, envFile = ENV_FILE_MOCK) =>
  `
  cd ${iosDir} &&
  export ENVFILE=${envFile} &&
  xcodebuild
    ARCHS=${iosArch}
    ONLY_ACTIVE_ARCH=YES
    -workspace ${SCHEME}.xcworkspace
    -scheme ${SCHEME}
    -configuration ${configuration}
    -sdk iphonesimulator
    -derivedDataPath build
`
    .replace(/\s+/g, " ")
    .trim();

const getAndroidBuildCommand = (assembleTask, testBuildType, envFile = ENV_FILE_MOCK) =>
  `
  cd ${androidDir} &&
  ENVFILE=${envFile}
  SENTRY_DISABLE_AUTO_UPLOAD=true
  ./gradlew
    app:${assembleTask}
    ${ANDROID_ASSEMBLE_TEST}
    -DtestBuildType=${testBuildType}
    -PreactNativeArchitectures=${androidArch}
`
    .replace(/\s+/g, " ")
    .trim();

const createIosAppConfig = (name, configuration, envFile = ENV_FILE_MOCK) => ({
  type: "ios.app",
  build: getIosBuildCommand(configuration, envFile),
  binaryPath: getIosBinary(configuration),
  webView: {
    enabled: true,
    type: "react-native-webview",
  },
});

const createAndroidAppConfig = (name, assembleTask, testBuildType, envFile = ENV_FILE_MOCK) => ({
  type: "android.apk",
  build: getAndroidBuildCommand(assembleTask, testBuildType, envFile),
  binaryPath: getAndroidBinary(testBuildType),
  testBinaryPath: getAndroidTestBinary(testBuildType),
  webView: {
    enabled: true,
    type: "react-native-webview",
  },
});

const appConfigs = [
  { name: "ios.debug", factory: createIosAppConfig, args: ["Debug"] },
  { name: "ios.staging", factory: createIosAppConfig, args: ["Staging"] },
  { name: "ios.release", factory: createIosAppConfig, args: ["Release"] },
  {
    name: "ios.prerelease",
    factory: createIosAppConfig,
    args: ["Release", ENV_FILE_MOCK_PRERELEASE],
  },
  { name: "android.debug", factory: createAndroidAppConfig, args: ["assembleDebug", "debug"] },
  { name: "android.release", factory: createAndroidAppConfig, args: ["assembleDetox", "detox"] },
  {
    name: "android.prerelease",
    factory: createAndroidAppConfig,
    args: ["assembleDetoxPreRelease", "detoxPreRelease", ENV_FILE_MOCK_PRERELEASE],
  },
];

const apps = appConfigs.reduce((acc, { name, factory, args }) => {
  acc[name] = factory(name, ...args);
  return acc;
}, {});

const deviceConfigs = [
  {
    name: "simulator",
    type: "ios.simulator",
    device: { name: "iOS Simulator" },
  },
  {
    name: "emulator",
    type: "android.emulator",
    device: { avdName: "Android_Emulator" },
    gpuMode: "swiftshader_indirect",
    headless: !!process.env.CI,
  },
];

const devices = deviceConfigs.reduce((acc, config) => {
  acc[config.name] = {
    type: config.type,
    device: config.device,
    ...(config.gpuMode && {
      gpuMode: config.gpuMode,
      headless: config.headless,
    }),
  };
  return acc;
}, {});

const configurationNames = [
  "ios.sim.debug",
  "ios.sim.staging",
  "ios.sim.release",
  "ios.sim.prerelease",
  "android.emu.debug",
  "android.emu.release",
  "android.emu.prerelease",
];

const configurations = configurationNames.reduce((acc, config) => {
  const [platform] = config.split(".");
  acc[config] = {
    device: platform === "ios" ? "simulator" : "emulator",
    app: config.replace("sim.", "").replace("emu.", ""),
  };
  return acc;
}, {});

const shouldReinstallApp =
  process.env.REINSTALL_APP !== undefined ? process.env.REINSTALL_APP === "true" : !process.env.CI;

module.exports = {
  configuration: "ios.sim.debug",
  testRunner: {
    $0: "ts-jest",
    args: {
      config: "jest.config.ts",
    },
    jest: {
      setupTimeout: 500000,
    },
    retries: 0,
  },
  logger: {
    level: process.env.DEBUG_DETOX ? "trace" : "info",
  },
  artifacts: {
    screenshots: "failing",
    logs: "all",
  },
  behavior: {
    init: {
      reinstallApp: shouldReinstallApp,
      exposeGlobals: false,
    },
    launchApp: "auto",
    cleanup: {
      shutdownDevice: !!process.env.CI,
    },
  },
  apps,
  devices,
  configurations,
};
