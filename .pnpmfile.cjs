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
  const major = parseInt(
    pkg.version?.replace(/(\^|~|>=|>|<=|<)/g, "").split(".")[0] || "0"
  );

  /*
    Fix packages using wrong @types/react versions by making it a peer dependency.
    So ultimately it uses our types package instead of their own which can conflict.
  */
  if (
    !!pkg.dependencies["@types/react"] &&
    !pkg.name.startsWith("@ledgerhq") &&
    !pkg.private
  ) {
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
        Adding jest and co. as dev. dependencies for /ledgerjs/* sub-packages.
        This is done this way because these packages are not hoisted hence unaccessible otherwise.
        Furthermore it makes these packages self-contained which eases the CI process.
      */
      addDevDependencies(
        /^@ledgerhq\/(hw-app.*|hw-transport.*|cryptoassets|devices|errors|logs|react-native-hid|react-native-hw-transport-ble|types-.*)$/,
        {
          jest: "^28.1.1",
          "ts-jest": "^28.0.5",
          "ts-node": "^10.4.0",
          "@types/node": "*",
          "@types/jest": "*",
          "source-map-support": "*",
          typescript: "^4",
          documentation: "13.2.4",
          rimraf: "*",
        },
        { silent: true }
      ),
      /*
        The following packages are broken and do not declare their dependencies properly.
        So we are going to patch these until the maintainers fix their own stuff…
        Feel free to make PRs if you feel like it :).
      */
      /* Storybook packages */
      addDependencies("@storybook/webpack-config", { "resolve-from": "*" }),
      addDependencies("@storybook/addon-knobs", {
        // Match the major version of the package
        "@storybook/client-api": major ? "" + major : "*",
      }),
      /* @celo/* packages */
      addDependencies(/@celo\/(?!base)+/, { "@celo/base": `^${pkg.version}` }),
      addDependencies("@celo/connect", {
        "@celo/base": `^${pkg.version}`,
        "web3-eth-contract": pkg.peerDependencies?.web3 ?? "*",
      }),
      addDependencies("@celo/contractkit", {
        "web3-utils": pkg.dependencies?.["web3"],
      }),
      addDependencies("@celo/utils", {
        randombytes: "*",
        rlp: "*",
      }),
      /*  @cosmjs/* packages */
      addDependencies("@cosmjs/proto-signing", {
        "@cosmjs/crypto": pkg.version,
        "@cosmjs/encoding": pkg.version,
        "@cosmjs/utils": pkg.version,
        "@cosmjs/math": pkg.version,
      }),
      addDependencies("@cosmjs/tendermint-rpc", {
        "@cosmjs/utils": pkg.version,
      }),
      /* @walletconnect/* packages */
      addDependencies("@walletconnect/iso-crypto", {
        "@walletconnect/encoding": "*",
      }),
      addDependencies(/^@walletconnect\/.*/, {
        tslib: "*",
      }),
      /* React Native and Metro bundler packages */
      // Crashes ios build if removed /!\
      addDependencies("react-native-codegen", {
        glob: "*",
        invariant: "*",
      }),
      // Crashes ios build if removed /!\
      addDependencies("react-native", {
        mkdirp: "*",
        yargs: "*",
      }),
      addPeerDependencies("@react-native-community/cli", {
        "metro-resolver": "*",
      }),
      addPeerDependencies("metro-config", {
        "metro-transform-worker": "*",
      }),
      addPeerDependencies("metro-transform-worker", {
        "metro-minify-uglify": "*",
      }),
      /* @expo/* packages */
      addDependencies("@expo/webpack-config", {
        "resolve-from": "*",
        "fs-extra": "*",
      }),
      addDependencies("expo-cli", { "@expo/metro-config": "*" }),
      addDependencies("@expo/metro-config", { glob: "*" }),
      addDependencies("@expo/dev-tools", { "@expo/spawn-async": "*" }),
      addDependencies("@expo/dev-server", {
        "@expo/config": "*",
        "@expo/spawn-async": "*",
        glob: "*",
      }),
      /* Other packages */
      addPeerDependencies("@svgr/core", { "@svgr/plugin-svgo": "*" }),
      addDependencies("@sentry/react-native", {
        tslib: "*",
        promise: "*",
      }),
      addDependencies("react-native-text-input-mask", {
        tslib: "*",
      }),
      addDependencies("react-native-locale", {
        fbjs: "*",
      }),
      addPeerDependencies("any-observable", {
        rxjs: "*",
      }),
      addPeerDependencies("@cspotcode/source-map-support", {
        "source-map-support": "*",
      }),
      addPeerDependencies("eslint-plugin-jest", {
        jest: "*",
      }),
      addPeerDependencies("jest-worker", {
        metro: "*",
      }),
      addPeerDependencies("react-lottie", {
        "prop-types": "*",
      }),
      // "dmg-builder" is required to build .dmg electron apps on macs,
      // but is not declared as such by app-builder-lib.
      // I'm not adding it as a dependency because if I did,
      // then pnpm would fail on win / linux during install.
      // Mildly related (error is not the same): https://github.com/pnpm/pnpm/issues/3640
      addPeerDependencies("app-builder-lib", {
        "dmg-builder": "*",
        lodash: "*",
      }),
      // Try to prevent pnpm-lock.yaml flakiness
      removeDependencies("follow-redirects", ["debug"], {
        kind: "peerDependencies",
      }),
      /* Packages that are missing @types/* dependencies */
      addPeerDependencies("react-native-gesture-handler", {
        "@types/react": "*",
      }),
    ],
    pkg,
    context
  );

  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
