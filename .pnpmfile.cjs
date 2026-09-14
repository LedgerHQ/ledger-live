/**
 * This file exists for the sole purpose of hijacking the packages installation process.
 *
 * It contains monkey patches because some packages we use have issues when declaring
 * their own dependencies. It causes problems with pnpm which enforces a strict package resolution.
 *
 * Ideally package maintainers would update their packages and we would not need this file anymore.
 * But this is world is cruel… Feel free to reach out and make PRs if you are motivated enough.
 *
 * The patch list below is plain data and is also exported, so `pnpm audit:pnpmfile` can check it
 * against the lockfile. Keep it in this file: pnpm only rehashes `.pnpmfile.cjs` itself, so a list
 * kept in a required module would let patch edits pass without re-resolving.
 *
 * Every entry needs a `why`. Before adding one, check the upstream manifest really misses the
 * dependency under that exact kind — a patch that duplicates an existing declaration does nothing,
 * and the summary printed after resolution will say so.
 *
 * See: https://pnpm.io/pnpmfile
 */

const {
  process,
  addDependencies,
  removeDependencies,
  getPatchReport,
} = require("./tools/pnpm-utils");

/**
 * @type {Array<{
 *   target: string | RegExp,
 *   kind: "dependencies" | "peerDependencies" | "devDependencies",
 *   add?: Record<string, string>,
 *   remove?: string[],
 *   why: string,
 * }>}
 */
const patches = [
  {
    target: "@zondax/ledger-cosmos-js",
    kind: "dependencies",
    remove: ["crypto"],
    why: "Declares crypto@^1.0.1, the npm placeholder package, where it means the node builtin.",
  },

  /* React Native and Metro bundler packages */
  {
    target: "react-native",
    kind: "dependencies",
    add: { mkdirp: "*" },
    why: "Does not declare mkdirp. Historically flagged as breaking the iOS build when removed — do not drop without an iOS build.",
  },
  {
    target: "@react-native-community/cli",
    kind: "peerDependencies",
    add: { "metro-resolver": "*" },
    why: "Does not declare a metro-resolver peer; without it the resolved metro graph changes.",
  },
  {
    target: "@react-native-community/cli-tools",
    kind: "peerDependencies",
    add: { "find-up": "*" },
    why: "The v6.2.1 copy still in the graph declares neither find-up nor a peer for it.",
  },
  {
    target: "@react-native-community/cli-tools",
    kind: "dependencies",
    add: { execa: "5.0.0" },
    why: "Same v6.2.1 copy: no execa dependency; pinned to 5.0.0 to match what the v18 copy resolves.",
  },
  {
    target: "@react-native-community/cli-platform-ios",
    kind: "dependencies",
    add: { execa: "5.0.0" },
    why: "Does not declare execa; pinned to 5.0.0 to match the version the rest of the CLI resolves.",
  },
  {
    target: "metro-config",
    kind: "peerDependencies",
    add: { "metro-transform-worker": "*" },
    why: "Does not declare a metro-transform-worker peer, so it would not share the metro copy the app pins.",
  },
  {
    target: "metro-transform-worker",
    kind: "peerDependencies",
    add: { "metro-minify-terser": "*" },
    why: "Declares metro-minify-terser as a plain dependency; as a peer it shares the app copy instead of duplicating.",
  },

  /* Expo packages */
  {
    target: "expo",
    kind: "peerDependencies",
    add: { "expo-modules-autolinking": "*", "expo-modules-core": "*" },
    why: "Declares expo-modules-autolinking/expo-modules-core as plain dependencies; as peers they stay deduped with the app.",
  },
  {
    target: /^expo-/,
    kind: "peerDependencies",
    add: {
      "expo-modules-core": "*",
      "expo-constants": "*",
      "react-native": "*",
      react: "*",
    },
    why: "Blanket rule: expo-* modules under-declare their host packages, assuming a hoisted node_modules.",
  },

  /* Electron builder */
  {
    target: "app-builder-lib",
    kind: "peerDependencies",
    add: { "node-abi": "4.9.0", lodash: "*" },
    why: "Undeclared peers. node-abi is pinned to match the root `resolutions` entry.",
  },

  /* Tooling */
  {
    target: "jest-allure2-reporter",
    kind: "dependencies",
    add: { tslib: "*" },
    why: "Compiled output uses tslib helpers but the manifest does not declare tslib.",
  },
  {
    target: "detox",
    kind: "dependencies",
    add: {
      "@jest/reporters": "*",
      "jest-environment-node": "*",
      "jest-circus": "*",
    },
    why: "Its only peer is jest, yet it loads these Jest internals directly.",
  },
  {
    target: "documentation",
    kind: "dependencies",
    add: { micromark: "*" },
    why: "Does not declare micromark, which its remark pipeline needs.",
  },
  {
    target: "@actions/github",
    kind: "dependencies",
    add: { undici: "*" },
    why: "v6 references undici for the fetch-based Octokit client but does not declare it.",
  },
  {
    target: "@cspotcode/source-map-support",
    kind: "peerDependencies",
    add: { "source-map-support": "*" },
    why: "Does not declare a source-map-support peer.",
  },
  {
    target: "@svgr/core",
    kind: "peerDependencies",
    add: { "@svgr/plugin-svgo": "*" },
    why: "v5.5.0 does not declare an @svgr/plugin-svgo peer, which it needs when svgo is enabled.",
  },
  {
    target: "postcss-loader",
    kind: "dependencies",
    add: {
      "postcss-flexbugs-fixes": "*",
      "postcss-preset-env": "*",
      "postcss-normalize": "*",
    },
    why: "v6 does not declare these postcss plugins, which our config asks it to resolve.",
  },
  {
    target: "follow-redirects",
    kind: "peerDependencies",
    remove: ["debug"],
    why: "Its optional `debug` peer makes the resolved id depend on who else pulled debug, which churns the lockfile.",
  },

  /* App dependencies */
  {
    target: "tronweb",
    kind: "dependencies",
    add: {
      "aes-js": "*",
      "@noble/hashes": "*",
      "@noble/secp256k1": "*",
      "@ethersproject/bytes": "*",
      "@ethersproject/bignumber": "*",
      "@ethersproject/keccak256": "*",
      "@ethersproject/properties": "*",
      "@ethersproject/strings": "*",
      "@ethersproject/logger": "*",
    },
    why: "Uses these crypto primitives without declaring them; only @noble/hashes is also a live-common dependency.",
  },
  {
    target: "rn-fetch-blob",
    kind: "dependencies",
    add: { lodash: "*" },
    why: "Uses lodash without declaring it.",
  },
  {
    target: "react-native-config",
    kind: "peerDependencies",
    add: { "react-native": "*" },
    why: "Native module that declares no react-native peer.",
  },
  {
    target: "react-native-easy-markdown",
    kind: "peerDependencies",
    add: { "prop-types": "*" },
    why: "Old component that uses prop-types without declaring a peer for it.",
  },
  {
    target: "react-lottie",
    kind: "peerDependencies",
    add: { "prop-types": "*" },
    why: "Declares prop-types as a plain dependency; as a peer it shares the app copy instead of duplicating.",
  },
  {
    target: "asyncstorage-down",
    kind: "peerDependencies",
    add: { "@react-native-async-storage/async-storage": "*" },
    why: "Written against the AsyncStorage API that moved out of react-native core into its own package.",
  },
];

const appliedPatches = patches.map(patch =>
  patch.remove
    ? removeDependencies(patch.target, patch.remove, { kind: patch.kind })
    : addDependencies(patch.target, patch.add, { kind: patch.kind }),
);

function readPackage(pkg, context) {
  /*
    Fix packages using wrong @types/react versions by making it a peer dependency.
    So ultimately it uses our types package instead of their own which can conflict.
  */
  if (!!pkg.dependencies["@types/react"] && !pkg.name.startsWith("@ledgerhq") && !pkg.private) {
    delete pkg.dependencies["@types/react"];
    pkg.peerDependencies["@types/react"] = "*";
    pkg.peerDependenciesMeta = {
      ...pkg.peerDependenciesMeta,
      "@types/react": { optional: true },
    };
  }

  process(appliedPatches, pkg, context);

  return pkg;
}

/*
  Report patches that did nothing during this resolution. Informative only: pnpm reuses the
  lockfile when nothing changed, so a patch can show up here simply because its package was
  never re-read. `pnpm audit:pnpmfile` is the gate.
*/
function afterAllResolved(lockfile) {
  const { never, noop } = getPatchReport();
  if (never.length || noop.length) {
    console.log("\n[.pnpmfile.cjs] patches that had no effect during this resolution:");
    never.forEach(key => console.log(`  · ${key} — never matched a package`));
    noop.forEach(key => console.log(`  · ${key} — the package already declares it`));
    console.log("  Check them against the patch list before trusting this list.\n");
  }
  return lockfile;
}

module.exports = {
  patches,
  hooks: {
    readPackage,
    afterAllResolved,
  },
};
