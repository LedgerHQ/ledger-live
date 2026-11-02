// Keep binary paths in sync with e2e/mobile/scripts/e2e-binaries.cjs so that e2e tests can find them

const os = require("node:os");
const path = require("node:path");

const appDir = path.resolve(__dirname, "..");
const iosArch = "arm64";
// Host-keyed so an inherited CI variable cannot select the wrong ABI. Override: E2E_ANDROID_ABI.
// process.arch is "x64" under Rosetta; os.cpus() still reports the host's "Apple ..." brand string.
const isAppleSiliconHost =
  process.platform === "darwin" &&
  (process.arch === "arm64" || (os.cpus()[0]?.model ?? "").startsWith("Apple"));
const androidArch = process.env.E2E_ANDROID_ABI || (isAppleSiliconHost ? "arm64-v8a" : "x86_64");

const SCHEME = "ledgerlivemobile";
const iosBuildDir = path.join(appDir, "ios", "build");
const androidDir = path.join(appDir, "android");

const envFile = name => path.join(appDir, name);

const configurations = {
  "ios.sim.debug": {
    platform: "ios",
    envFile: envFile(".env.mock"),
    xcodeConfiguration: "Debug",
  },
  "ios.sim.staging": {
    platform: "ios",
    envFile: envFile(".env.mock"),
    xcodeConfiguration: "Staging",
  },
  "ios.sim.release": {
    platform: "ios",
    envFile: envFile(".env.mock"),
    xcodeConfiguration: "Release",
  },
  "ios.sim.prerelease": {
    platform: "ios",
    envFile: envFile(".env.mock.prerelease"),
    xcodeConfiguration: "Release",
  },
  "android.emu.debug": {
    platform: "android",
    envFile: envFile(".env.mock"),
    gradleTaskSuffix: "Debug",
    testBuildType: "debug",
  },
  "android.emu.release": {
    platform: "android",
    envFile: envFile(".env.mock"),
    gradleTaskSuffix: "Detox",
    testBuildType: "detox",
  },
  "android.emu.prerelease": {
    platform: "android",
    envFile: envFile(".env.mock.prerelease"),
    gradleTaskSuffix: "DetoxPreRelease",
    testBuildType: "detoxPreRelease",
  },
};

const iosBinaryPath = xcodeConfiguration =>
  path.join(iosBuildDir, `Build/Products/${xcodeConfiguration}-iphonesimulator/${SCHEME}.app`);

const androidBinaryPath = testBuildType =>
  path.join(
    androidDir,
    `app/build/outputs/apk/${testBuildType}/app-${androidArch}-${testBuildType}.apk`,
  );

const androidTestBinaryPath = testBuildType =>
  path.join(
    androidDir,
    `app/build/outputs/apk/androidTest/${testBuildType}/app-${testBuildType}-androidTest.apk`,
  );

module.exports = {
  appDir,
  iosArch,
  androidArch,
  configurations,
  iosBinaryPath,
  androidBinaryPath,
  androidTestBinaryPath,
};
