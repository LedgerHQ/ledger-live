// Expo fingerprint of the native projects: the cache key of the e2e native builds (scripts/native-fingerprint.mjs).
//
// Fingerprint ignores nested node_modules, so under pnpm the store dir name (name@version[_patch_hash=...]_<peers>)
// in the autolinking config is its only signal for npm native modules. Keep the version and patch, drop the peer
// suffix: peer-only changes would otherwise trigger native rebuilds. Podfile.lock and project.pbxproj embed the
// same paths.
const PNPM_STORE_DIR =
  /\.pnpm\/((?:@[^+/]+\+)?[^@/]+@[^_/"`'\s]+(?:_patch_hash=[0-9a-f]+)?)[^/"`'\s]*\/node_modules/g;
const dropPeerSuffix = text => text.replace(PNPM_STORE_DIR, ".pnpm/$1/node_modules");
const FILES_WITH_STORE_PATHS = /(Podfile\.lock|project\.pbxproj)$/;
const pendingFiles = new Map();

const e2eBuildFile = filePath => ({ type: "file", filePath, reasons: ["e2eNativeBuild"] });

/** @type {import('@expo/fingerprint').Config} */
module.exports = {
  // The e2e builds don't depend on the app version or the package.json scripts.
  sourceSkips: ["ExpoConfigVersions", "PackageJsonScriptsAll"],
  extraSources: [
    e2eBuildFile("fingerprint.config.js"),
    e2eBuildFile("react-native.config.js"),
    e2eBuildFile("scripts/native-fingerprint.mjs"),
    e2eBuildFile("scripts/e2e-build.mjs"),
    e2eBuildFile("scripts/e2e-binaries.cjs"),
    e2eBuildFile("scripts/syncAppVersion.js"),
    e2eBuildFile("../../e2e/mobile/detox.config.js"),
  ],
  fileHookTransform(source, chunk, isEndOfFile) {
    if (source.type === "contents")
      return typeof chunk === "string" ? dropPeerSuffix(chunk) : chunk;
    if (!FILES_WITH_STORE_PATHS.test(source.filePath)) return chunk;
    // A store path can straddle two chunks, so buffer the whole file.
    const text =
      (pendingFiles.get(source.filePath) ?? "") + (chunk == null ? "" : chunk.toString());
    if (!isEndOfFile) {
      pendingFiles.set(source.filePath, text);
      return "";
    }
    pendingFiles.delete(source.filePath);
    return dropPeerSuffix(text);
  },
};
