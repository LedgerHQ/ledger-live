const fs = require("node:fs");
const path = require("node:path");

const MOBILE_APP_DIR = path.resolve(__dirname, "../../../apps/ledger-live-mobile");
const PACKAGE_JSON = path.join(MOBILE_APP_DIR, "package.json");
const ANDROID_BUILD_GRADLE = path.join(MOBILE_APP_DIR, "android/app/build.gradle");
const IOS_INFO_PLIST = path.join(MOBILE_APP_DIR, "ios/ledgerlivemobile/Info.plist");

function writeIfChanged(filePath, updated, original) {
  if (updated !== original) {
    fs.writeFileSync(filePath, updated);
  }
}

// Fails loudly if a file reformat ever breaks the pattern, instead of silently no-op'ing.
function assertMatches(pattern, contents, filePath, description) {
  if (!pattern.test(contents)) {
    throw new Error(`syncAppVersion: could not find ${description} to update in ${filePath}`);
  }
}

function syncAndroidVersionName(version) {
  const original = fs.readFileSync(ANDROID_BUILD_GRADLE, "utf8");
  const pattern = /versionName\s+"[^"]*"/;
  assertMatches(pattern, original, ANDROID_BUILD_GRADLE, "a versionName declaration");
  const updated = original.replace(pattern, `versionName "${version}"`);
  writeIfChanged(ANDROID_BUILD_GRADLE, updated, original);
}

function syncIosShortVersionString(versionRaw) {
  const version = versionRaw.split(/[+-]/)[0]; // normalize the version as in fastlane
  const original = fs.readFileSync(IOS_INFO_PLIST, "utf8");
  const pattern = /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]*(<\/string>)/;
  assertMatches(pattern, original, IOS_INFO_PLIST, "a CFBundleShortVersionString entry");
  const updated = original.replace(pattern, `$1${version}$2`);
  writeIfChanged(IOS_INFO_PLIST, updated, original);
}

const SYNC_BY_PLATFORM = {
  ios: syncIosShortVersionString,
  android: syncAndroidVersionName,
};

// Detox's build commands shell into gradlew/xcodebuild directly, skipping the fastlane hooks that
// normally stamp these native files from package.json — so E2E builds would otherwise ship a
// stale app version.
function syncAppVersion(platform) {
  const sync = SYNC_BY_PLATFORM[platform];
  if (!sync) {
    throw new Error(`syncAppVersion: unknown platform "${platform}" (expected "ios" or "android")`);
  }
  sync(JSON.parse(fs.readFileSync(PACKAGE_JSON, "utf8")).version);
}

module.exports = syncAppVersion;

if (require.main === module) {
  syncAppVersion(process.argv[2]);
}
