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
const pendingChunks = new Map();

const e2eBuildFile = filePath => ({ type: "file", filePath, reasons: ["e2eNativeBuild"] });

// pnpm truncates long store dir names, patch hash included, so hash the patches themselves.
const PATCHES_DIR = "../../patches";

// The Android test APK is built against node_modules/detox, which is not autolinked.
const detoxVersion = require(require.resolve("detox/package.json", { paths: [__dirname] })).version;

/** @type {import('@expo/fingerprint').Config} */
module.exports = {
  // The app version stays in the key: syncAppVersion.js writes it into the native projects.
  sourceSkips: ["PackageJsonScriptsAll"],
  ignorePaths: [
    "../../shared/native-performance/node_modules/**",
    // Only TypeScript today: a TurboModule codegen spec added here would need to be hashed.
    "../../shared/native-performance/src/**",
    "../../shared/native-performance/*.md",
    "../../shared/native-performance/jest.config.js",
  ],
  extraSources: [
    e2eBuildFile("fingerprint.config.js"),
    e2eBuildFile("react-native.config.js"),
    e2eBuildFile(".env.mock"),
    e2eBuildFile(".env.mock.prerelease"),
    e2eBuildFile("scripts/native-fingerprint.mjs"),
    e2eBuildFile("scripts/e2e-build.mjs"),
    e2eBuildFile("scripts/e2e-binaries.cjs"),
    e2eBuildFile("scripts/syncAppVersion.js"),
    e2eBuildFile("../../e2e/mobile/detox.config.js"),
    { type: "dir", filePath: PATCHES_DIR, reasons: ["e2eNativeBuild"] },
    { type: "contents", id: "detoxVersion", contents: detoxVersion, reasons: ["e2eNativeBuild"] },
  ],
  fileHookTransform(source, chunk, isEndOfFile) {
    if (source.type === "contents")
      return typeof chunk === "string" ? dropPeerSuffix(chunk) : chunk;
    if (!FILES_WITH_STORE_PATHS.test(source.filePath)) return chunk;
    // A store path or a UTF-8 character can straddle two chunks, so decode the whole file at once.
    const chunks = pendingChunks.get(source.filePath) ?? [];
    if (chunk != null) chunks.push(Buffer.from(chunk));
    if (!isEndOfFile) {
      pendingChunks.set(source.filePath, chunks);
      return "";
    }
    pendingChunks.delete(source.filePath);
    return dropPeerSuffix(Buffer.concat(chunks).toString("utf8"));
  },
};
