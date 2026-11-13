const fs = require("node:fs");
const path = require("node:path");

// Expo fingerprint of the native projects: the cache key of the e2e native builds (scripts/native-fingerprint.mjs).
//
// Fingerprint ignores nested node_modules, so under pnpm the store dir name (name@version[_patch_hash=...]_<peers>)
// in the autolinking config is its only signal for npm native modules. Keep the version and patch, drop the peer
// suffix: peer-only changes would otherwise trigger native rebuilds. Podfile.lock and project.pbxproj embed the
// same paths.
// Two passes keep both regexes linear: match the whole dir name and package, then keep the dir name's prefix.
const PNPM_STORE_DIR = /\.pnpm\/([^/"`'\s]+)\/node_modules(\/(?:@[^/"`'\s]+\/)?[^/"`'\s]+)?/g;
const NAME_VERSION_PATCH = /^(?:@[^+]+\+)?[^@]+@[^_]+(?:_patch_hash=[0-9a-f]+)?/;
// pnpm cuts a long dir name to a prefix and a hash of the full name, peers included. The version comes from the
// package instead, and the patch from appliedPatches.
const TRUNCATED_STORE_DIR = /_[0-9a-f]{32}$/;
const PNPM_STORE = path.resolve(__dirname, "../../node_modules/.pnpm");
let storeDirs;
const installedNameVersion = (dir, packageName) => {
  const manifest = path.join(PNPM_STORE, dir, "node_modules", packageName, "package.json");
  if (!fs.existsSync(manifest)) return null;
  const { name, version } = JSON.parse(fs.readFileSync(manifest, "utf8"));
  return `${name.replace("/", "+")}@${version}`;
};
const storeDirKey = (dir, packageName) => {
  if (!TRUNCATED_STORE_DIR.test(dir)) return NAME_VERSION_PATCH.exec(dir)?.[0] ?? dir;
  // Unresolvable: keep the dir name, which can only cause an extra rebuild.
  if (!packageName) return dir;
  const installed = installedNameVersion(dir, packageName);
  if (installed) return installed;
  // A committed Podfile.lock can name a peer variant that is no longer installed. Use the installed variants with
  // the same prefix when they agree on one version.
  const prefix = dir.replace(TRUNCATED_STORE_DIR, "");
  storeDirs ??= fs.existsSync(PNPM_STORE) ? fs.readdirSync(PNPM_STORE) : [];
  const variants = new Set(
    storeDirs
      .filter(
        other =>
          TRUNCATED_STORE_DIR.test(other) && other.replace(TRUNCATED_STORE_DIR, "") === prefix,
      )
      .map(other => installedNameVersion(other, packageName)),
  );
  return variants.size === 1 && !variants.has(null) ? [...variants][0] : dir;
};
const dropPeerSuffix = text =>
  text.replace(
    PNPM_STORE_DIR,
    (match, dir, packagePath = "") =>
      `.pnpm/${storeDirKey(dir, packagePath.slice(1))}/node_modules${packagePath}`,
  );
const FILES_WITH_STORE_PATHS = /(Podfile\.lock|project\.pbxproj)$/;
const pendingChunks = new Map();

const e2eBuildFile = filePath => ({ type: "file", filePath, reasons: ["e2eNativeBuild"] });

// pnpm truncates long store dir names, patch hash included, so hash the patches themselves.
const PATCHES_DIR = "../../patches";

// Which patches pnpm applies (package and patch hash): removing a mapping can leave patches/ unchanged.
const lockfileLines = fs
  .readFileSync(path.resolve(__dirname, "../../pnpm-lock.yaml"), "utf8")
  .split("\n");
const patchedStart = lockfileLines.indexOf("patchedDependencies:");
const patchedEnd = lockfileLines.findIndex(
  (line, i) => i > patchedStart && line !== "" && !line.startsWith(" "),
);
const patchedLines =
  patchedEnd === -1
    ? lockfileLines.slice(patchedStart)
    : lockfileLines.slice(patchedStart, patchedEnd);
const appliedPatches = patchedStart === -1 ? "" : patchedLines.join("\n");

// The Android test APK is built against node_modules/detox, which is not autolinked.
const detoxVersion = require(require.resolve("detox/package.json", { paths: [__dirname] })).version;

// sourceSkips drops every package.json script, but CI builds the native apps through these.
const { scripts } = require("./package.json");
const e2eBuildScripts = JSON.stringify(
  ["e2e:ci", "e2e:build"]
    .flatMap(name => [`pre${name}`, name, `post${name}`])
    .map(name => [name, scripts[name] ?? null]),
);

/** @type {import('@expo/fingerprint').Config} */
module.exports = {
  // Detox builds read the app version from the JS bundle (DETOX_APP_VERSION), so a version bump keeps the binary.
  sourceSkips: ["PackageJsonScriptsAll", "ExpoConfigVersions"],
  ignorePaths: [
    "../../shared/native-performance/node_modules/**",
    // Only TypeScript today: a TurboModule codegen spec added here would need to be hashed.
    "../../shared/native-performance/src/**",
    "../../shared/native-performance/*.md",
    "../../shared/native-performance/jest.config.js",
    "../../shared/native-performance/project.json",
    "../../shared/native-performance/tsconfig.json",
  ],
  extraSources: [
    e2eBuildFile("fingerprint.config.js"),
    e2eBuildFile("react-native.config.js"),
    e2eBuildFile(".env.mock"),
    e2eBuildFile(".env.mock.prerelease"),
    e2eBuildFile("scripts/native-fingerprint.mjs"),
    e2eBuildFile("scripts/e2e-build.mjs"),
    e2eBuildFile("scripts/e2e-binaries.cjs"),
    e2eBuildFile("../../e2e/mobile/detox.config.js"),
    { type: "dir", filePath: PATCHES_DIR, reasons: ["e2eNativeBuild"] },
    { type: "contents", id: "detoxVersion", contents: detoxVersion, reasons: ["e2eNativeBuild"] },
    {
      type: "contents",
      id: "appliedPatches",
      contents: appliedPatches,
      reasons: ["e2eNativeBuild"],
    },
    {
      type: "contents",
      id: "e2eBuildScripts",
      contents: e2eBuildScripts,
      reasons: ["e2eNativeBuild"],
    },
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
