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
        Fix the unmet peer dep on rxjs for the wallet-api-server
        Because we're still using rxjs v6 everywhere
        We only added rxjs v7 as an alias on rxjs7
      */
      addDependencies("@ledgerhq/wallet-api-server", {
        rxjs: pkg.peerDependencies?.rxjs ?? "*",
      }),
      removeDependencies("@ledgerhq/wallet-api-server", ["rxjs"], {
        kind: "peerDependencies",
      }),
      /*
        The following packages are broken and do not declare their dependencies properly.
        So we are going to patch these until the maintainers fix their own stuff…
        Feel free to make PRs if you feel like it :).
      */
      /*
        Remove react-native/react-dom from react-redux optional peer dependencies.
        Without this, using react-redux code in LLM from LLC will fail because the package will get duplicated.
      */
      removeDependencies("react-redux", ["react-native", "react-dom"], {
        kind: "peerDependencies",
      }),
      /* Storybook packages */
      addDependencies("@storybook/webpack-config", { "resolve-from": "*" }),
      addDependencies("@storybook/addon-knobs", {
        // Match the major version of the package
        "@storybook/client-api": major ? "" + major : "*",
      }),
      addPeerDependencies("@storybook/addon-ondevice-backgrounds", {
        "@emotion/native": "*",
      }),
      addPeerDependencies("@storybook/addon-react-native-web", {
        webpack: "*",
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
        "fp-ts": "*",
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
        "metro-minify-terser": "*",
      }),
      /* Expo packages… */
      addDependencies("@expo/webpack-config", {
        "resolve-from": "*",
        "fs-extra": "*",
        tapable: "*",
        "source-map": "*",
      }),
      addPeerDependencies("@expo/cli", {
        glob: "*",
        metro: "*",
        "metro-core": "*",
        "@expo/metro-config": "*",
        minimatch: "*",
      }),
      addDependencies("@expo/cli", {
        "find-yarn-workspace-root": "*",
      }),
      addDependencies("@expo/metro-config", { glob: "*" }),
      addDependencies("@expo/dev-tools", { "@expo/spawn-async": "*" }),
      addDependencies("@expo/dev-server", {
        "@expo/config": "*",
        "@expo/spawn-async": "*",
        glob: "*",
      }),
      addDependencies("expo-pwa", {
        "@expo/config": "*",
      }),
      addPeerDependencies("expo-modules-core", {
        "react-native": "*",
      }),
      addPeerDependencies("expo", {
        "react-native": "*",
        react: "*",
      }),
      addPeerDependencies(/^expo-/, {
        "expo-modules-core": "*",
        "expo-constants": "*",
        "react-native": "*",
        react: "*",
      }),
      addPeerDependencies("expo-asset", {
        "expo-file-system": "*",
      }),
      addPeerDependencies("expo-font", {
        "expo-asset": "*",
      }),
      /* Other packages */
      addDependencies("detox", {
        "@jest/reporters": "*",
        "jest-environment-node": "*",
        "jest-circus": "*",
      }),
      addDependencies("allure-playwright", { "@playwright/test": "*" }),
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
      addDependencies("react-native-tcp", {
        "stream-browserify": "*",
      }),
      addDependencies("postcss-loader", {
        "postcss-flexbugs-fixes": "*",
        "postcss-preset-env": "*",
        "postcss-normalize": "*",
      }),
      addPeerDependencies("any-observable", {
        rxjs: "*",
      }),
      addPeerDependencies("rxjs-compat", {
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
      addDependencies("@actions/cache", { "@azure/abort-controller": "*" }),
      addDependencies("rn-fetch-blob", { lodash: "*" }),
      // addPeerDependencies("styled-components", { "react-native": "*" }),
      addPeerDependencies("use-latest-callback", { react: "*" }),
      addPeerDependencies("rn-range-slider", {
        react: "*",
        "react-native": "*",
        "prop-types": "*",
      }),
      addPeerDependencies("react-native-animatable", {
        react: "*",
        "react-native": "*",
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
      addDependencies("@shopify/react-native-performance", {
        tslib: "*",
      }),
      addDependencies("@shopify/react-native-performance-navigation", {
        tslib: "*",
      }),
      addPeerDependencies("react-native-easy-markdown", {
        "prop-types": "*",
      }),
      addPeerDependencies("storyly-react-native", {
        "prop-types": "*",
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
