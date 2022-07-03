const extraConfig = require('metro-extra-config');
const {mergeConfig} = require('metro-config');

const options = {
  projectRoot: __dirname,
  // forcedDependencies: [
  // "react-native",
  // "react-native-reanimated",
  // "expo",
  // "expo-assets",
  // "expo-file-system",
  // "expo-font",
  // "expo-modules-core",
  // "expo-constants",
  // "@babel/runtime",
  // ],
};

const specificConfig = {
  resolver: {
    extraNodeModules: {
      ...require("node-libs-react-native"),
      fs: require.resolve("react-native-level-fs"),
      net: require.resolve("react-native-tcp"),
    },
    // makeMetroConfig adds the "module" field, but we skip it here on purpose
    // because it makes the "react-native-url-polyfill" package consume the
    // es6 version of the "punycode" package and crash (it expects a default export).
    resolverMainFields: ["react-native", "browser", "main"],
  },
};

const config = extraConfig(options, specificConfig);

const resolver = config.resolver.resolveRequest;

module.exports = mergeConfig(config, {
  resolver: {
    resolveRequest: (context, realModuleName, platform, moduleName) => {
      const resolution = resolver(
        context,
        realModuleName,
        platform,
        moduleName,
      );
      // duplicatesChecker({ context, moduleName, resolution });
      return resolution;
    },
  },
});
