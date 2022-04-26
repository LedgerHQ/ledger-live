const {
  process,
  removePeerDeps,
  addDependencies,
} = require("./tools/pnpm-utils");

function readPackage(pkg, context) {
  const major = parseInt(pkg.version?.split(".")[0] || "0");

  process(
    [
      // Prevents duplicate packages.
      removePeerDeps("react-redux", "styled-components"),
      // The following packages are broken and do not declare their dependencies properly.
      addDependencies(
        "@svgr/core",
        { "@svgr/plugin-svgo": "*" },
        { kind: "peerDependencies" }
      ),
      addDependencies("@storybook/webpack-config", { "resolve-from": "*" }),
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
      addDependencies("@cosmjs/proto-signing", {
        "@cosmjs/crypto": pkg.version,
        "@cosmjs/encoding": pkg.version,
        "@cosmjs/utils": pkg.version,
        "@cosmjs/math": pkg.version,
      }),
      addDependencies("@cosmjs/tendermint-rpc", {
        "@cosmjs/utils": pkg.version,
      }),
      addDependencies("@walletconnect/iso-crypto", {
        "@walletconnect/encoding": "*",
      }),
      addDependencies("react-native", {
        "react-native-codegen": "0.0.7",
        mkdirp: "*",
      }),
      addDependencies("react-native-codegen", {
        glob: "*",
        invariant: "*",
      }),
      addDependencies("@react-native-community/cli", {
        "metro-resolver": "^0.67.0",
      }),
      addDependencies("metro-config", {
        "metro-transform-worker": pkg.version,
      }),
      addDependencies("metro-transform-worker", {
        "metro-minify-uglify": pkg.version,
      }),
      addDependencies("@expo/webpack-config", {
        "resolve-from": "*",
      }),
      addDependencies("@sentry/react-native", {
        tslib: "*",
        promise: "*",
      }),
      addDependencies("react-native-text-input-mask", {
        tslib: "*",
      }),
      addDependencies(/^@walletconnect\/.*/, {
        tslib: "*",
      }),
      addDependencies("react-native-locale", {
        fbjs: "*",
      }),
      addDependencies(
        "any-observable",
        {
          rxjs: "*",
        },
        {
          kind: "peerDependencies",
        }
      ),
      addDependencies("@storybook/addon-knobs", {
        "@storybook/client-api": major ? "" + major : "*",
      }),
      addDependencies(
        "@cspotcode/source-map-support",
        {
          "source-map-support": "*",
        },
        {
          kind: "peerDependencies",
        }
      ),
      addDependencies(
        "eslint-plugin-jest",
        {
          jest: "*",
        },
        {
          kind: "peerDependencies",
        }
      ),
      addDependencies(
        "jest-worker",
        {
          metro: "*",
        },
        {
          kind: "peerDependencies",
        }
      ),
      addDependencies("documentation", { micromark: "*" }),
      // Adding jest and co. as dev. dependencies for ledgerjs sub-packages.
      // This is done this way because these packages are not hoisted hence unaccessible otherwise.
      addDependencies(
        /^@ledgerhq\/(hw-app.*|hw-transport.*|cryptoassets|devices|errors|logs|react-native-hid|react-native-hw-transport-ble|types-.*)$/,
        {
          jest: "^27.4.7",
          "ts-jest": "^27.1.2",
          "ts-node": "^10.4.0",
          "@types/node": "*",
          "source-map-support": "*",
          typescript: "4",
          documentation: "^13.2.5",
        },
        {
          kind: "devDependencies",
        }
      ),
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
