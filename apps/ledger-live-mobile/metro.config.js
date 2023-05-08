/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */

const extraConfig = require("metro-extra-config");

// Dependencies that are forcefully resolved from the LLM folder.
const forcedDependencies = [
  "react-redux",
  "react-native",
  "react-native-svg",
  "react-native-reanimated",
  "styled-components",
];

const specificConfig = {
  resolver: {
    extraNodeModules: {
      ...require("node-libs-react-native"),
      fs: require.resolve("react-native-level-fs"),
      net: require.resolve("react-native-tcp-socket"),
    },
    // makeMetroConfig adds the "module" field, but we skip it here on purpose
    // because it makes the "react-native-url-polyfill" package consume the
    // es6 version of the "punycode" package and crash (it expects a default export).
    resolverMainFields: ["react-native", "browser", "main"],
  },
};

const extraConfigOptions = {
  projectRoot: __dirname,
  forcedDependencies,
  remapModule: (context, moduleName, _platform) => {
    const { originModulePath } = context;

    // "package.js" contains "module.meta" calls that will not work with the react-native env.
    // To solve this replace with "packageInfo.cjs" which is safe.
    if (
      originModulePath.includes("@polkadot") &&
      moduleName.endsWith("packageInfo.js")
    ) {
      return moduleName.replace("packageInfo.js", "packageInfo.cjs");
    }

    // For other modules, it seems to be fine :).
    return moduleName;
  },
};

module.exports = extraConfig(extraConfigOptions, specificConfig);
