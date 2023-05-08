const extraConfig = require("metro-extra-config");
const { mergeConfig } = require("metro-config");
// const duplicatesChecker = extraConfig.duplicatesChecker();

const options = {
  projectRoot: __dirname,
  forcedDependencies: [
    "react-native-svg",
    "react-native",
    "react",
    // "react-native-reanimated",
    // "expo",
    // "expo-asset",
    // "expo-file-system",
    // "expo-font",
    // "expo-modules-core",
    // "expo-constants",
    // "@babel/runtime",
  ],
};

const config = extraConfig(options, {
  resolver: {
    resolverMainFields: ["sbmodern", "typescriptMain", "react-native", "browser", "main"],
  },
});

const resolver = config.resolver.resolveRequest;

module.exports = mergeConfig(config, {
  resolver: {
    extraNodeModules: {
      assert: require.resolve("assert/"),
      util: require.resolve("util/"),
    },
    resolveRequest: (context, moduleName, platform) => {
      let resolution;
      // Necessary because expo removed the ability to override package.json main field…
      if (moduleName === "./lib/index") {
        resolution = resolver(context, "./index", platform);
      } else {
        resolution = resolver(context, moduleName, platform);
      }
      // duplicatesChecker({ context, moduleName, resolution });
      return resolution;
    },
  },
});
