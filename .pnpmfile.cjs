/**
 * This file exists for the sole purpose of hijacking the packages installation process.
 *
 * It contains a lot of monkey patches because some packages we use have issues when declaring
 * their own dependencies. It causes problems with pnpm which enforces a strict package resolution.
 *
 * Ideally package maintainers would update their packages and we would not need this file anymore.
 * But this is world is cruel… Feel free to reach out and make PRs if you are motivated enough.
 *
 * See: https://pnpm.io/pnpmfile
 */

const {
  process,
  addDependencies,
  addDevDependencies,
  addPeerDependencies,
  removeDependencies,
} = require("./tools/pnpm-utils");

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

  process(
    [
      /*
        The following packages are broken and do not declare their dependencies properly.
        So we are going to patch these until the maintainers fix their own stuff…
        Feel free to make PRs if you feel like it :).
      */
      addDependencies("jest-allure2-reporter", { tslib: "*" }),
      removeDependencies("@zondax/ledger-cosmos-js", ["crypto"], {
        kind: "dependencies",
      }),
      /* React Native and Metro bundler packages */
      // react-native does not declare mkdirp; removing it has broken the iOS build before /!\
      addDependencies("react-native", {
        mkdirp: "*",
      }),

      addPeerDependencies("@react-native-community/cli", {
        "metro-resolver": "*",
      }),
      addPeerDependencies("@react-native-community/cli-tools", {
        "find-up": "*",
      }),
      addPeerDependencies("metro-config", {
        "metro-transform-worker": "*",
      }),
      addPeerDependencies("metro-transform-worker", {
        "metro-minify-terser": "*",
      }),

      /* Other packages */
      addDependencies("detox", {
        "@jest/reporters": "*",
        "jest-environment-node": "*",
        "jest-circus": "*",
      }),
      addPeerDependencies("@svgr/core", { "@svgr/plugin-svgo": "*" }),
      addDependencies("postcss-loader", {
        "postcss-flexbugs-fixes": "*",
        "postcss-preset-env": "*",
        "postcss-normalize": "*",
      }),
      addPeerDependencies("@cspotcode/source-map-support", {
        "source-map-support": "*",
      }),
      addPeerDependencies("react-lottie", {
        "prop-types": "*",
      }),
      addDependencies("rn-fetch-blob", { lodash: "*" }),

      addPeerDependencies("expo", {
        "expo-modules-autolinking": "*",
        "expo-modules-core": "*",
      }),
      addPeerDependencies(/^expo-/, {
        "expo-modules-core": "*",
        "expo-constants": "*",
        "react-native": "*",
        react: "*",
      }),

      // node-abi is pinned to match the root "resolutions" entry
      addPeerDependencies("app-builder-lib", {
        "node-abi": "4.9.0",
        lodash: "*",
      }),

      addPeerDependencies("react-native-config", {
        "react-native": "*",
      }),
      // Try to prevent pnpm-lock.yaml flakiness
      removeDependencies("follow-redirects", ["debug"], {
        kind: "peerDependencies",
      }),
      addPeerDependencies("react-native-easy-markdown", {
        "prop-types": "*",
      }),
      addPeerDependencies("asyncstorage-down", {
        "@react-native-async-storage/async-storage": "*",
      }),
      addDependencies("documentation", {
        micromark: "*",
      }),
      addDependencies("@react-native-community/cli-tools", {
        execa: "5.0.0",
      }),
      addDependencies("@react-native-community/cli-platform-ios", {
        execa: "5.0.0",
      }),
      // TODO:
      // Tron missing deps
      // They are also added to live-common dependencies
      // Is there another way without adding them explicitly ?
      addDependencies("tronweb", {
        "aes-js": "*",
        "@noble/hashes": "*",
        "@noble/secp256k1": "*",
        "@ethersproject/bytes": "*",
        "@ethersproject/bignumber": "*",
        "@ethersproject/keccak256": "*",
        "@ethersproject/properties": "*",
        "@ethersproject/strings": "*",
        "@ethersproject/logger": "*",
      }),
      addDependencies("@actions/github", {
        undici: "*",
      }),
    ],
    pkg,
    context,
  );

  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
