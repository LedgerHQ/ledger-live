const os = require("node:os");
const path = require("node:path");

/**
 * Copy of apps/ledger-live-mobile/scripts/e2e-binaries.cjs to avoid cross-project imports and dependencies.
 * Provides paths to the iOS and Android binaries for Detox tests.
 */

const appDir = path.resolve(__dirname, "../../../apps/ledger-live-mobile");
// Host-keyed so an inherited CI variable cannot select the wrong ABI. Override: E2E_ANDROID_ABI.
// process.arch is "x64" under Rosetta; os.cpus() still reports the host's "Apple ..." brand string.
const isAppleSiliconHost =
  process.platform === "darwin" &&
  (process.arch === "arm64" || (os.cpus()[0]?.model ?? "").startsWith("Apple"));
const androidArch = process.env.E2E_ANDROID_ABI || (isAppleSiliconHost ? "arm64-v8a" : "x86_64");

const SCHEME = "ledgerlivemobile";
const iosBuildDir = path.join(appDir, "ios", "build");
const androidDir = path.join(appDir, "android");

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
  iosBinaryPath,
  androidBinaryPath,
  androidTestBinaryPath,
};
