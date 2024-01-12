/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */

const path = require("path");
const extraConfig = require("metro-extra-config");
const tsconfig = require("./tsconfig.json");
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
// Dependencies that are forcefully resolved from the LLM folder.
const forcedDependencies = ["react-redux", "react-native", "react-native-svg", "styled-components"];

const removeStarPath = moduleName => moduleName.replace("/*", "");

const buildTsAlias = (conf = {}) =>
  Object.keys(conf).reduce(
    (acc, moduleName) => ({
      ...acc,
      [removeStarPath(moduleName)]: path.resolve(__dirname, removeStarPath(conf[moduleName][0])),
    }),
    {},
  );

const specificConfig = {
  resolver: {
    unstable_enableSymlinks: true,
    unstable_enablePackageExports: true,
    extraNodeModules: {
      ...require("node-libs-react-native"),
      fs: require.resolve("react-native-level-fs"),
      net: require.resolve("react-native-tcp-socket"),
      ...buildTsAlias(tsconfig.compilerOptions.paths),
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
    if (originModulePath.includes("@polkadot") && moduleName.endsWith("packageInfo.js")) {
      return moduleName.replace("packageInfo.js", "packageInfo.cjs");
    }

    // For other modules, it seems to be fine :).
    return moduleName;
  },
};

module.exports = module.exports = mergeConfig(
  getDefaultConfig(__dirname),
  extraConfig(extraConfigOptions, specificConfig),
);
