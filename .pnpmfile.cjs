const {
  process,
  addDependencies,
  addDevDependencies,
  addPeerDependencies,
} = require("./tools/pnpm-utils");

function readPackage(pkg, context) {
  const major = parseInt(pkg.version?.split(".")[0] || "0");

  process(
    [
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
      addDependencies("app-builder-lib", { "dmg-builder": "*", lodash: "*" }),
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
