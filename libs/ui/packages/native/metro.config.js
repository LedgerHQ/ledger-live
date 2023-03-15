const extraConfig = require("metro-extra-config");
const { mergeConfig } = require("metro-config");
// const duplicatesChecker = extraConfig.duplicatesChecker();

const options = {
  projectRoot: __dirname,
  forcedDependencies: [
    "react-native-svg",
    "react-native",
    "react-native-reanimated",
    "expo",
    "expo-asset",
    "expo-file-system",
    "expo-font",
    "expo-modules-core",
    "expo-constants",
    "@babel/runtime",
  ],
};

const config = extraConfig(options, {
  resolver: {
    resolverMainFields: ["typescriptMain", "react-native", "browser", "main"],
  },
});

const resolver = config.resolver.resolveRequest;

module.exports = mergeConfig(config, {
  resolver: {
    resolveRequest: (context, realModuleName, platform, moduleName) => {
      const resolution = resolver(context, realModuleName, platform, moduleName);
      // duplicatesChecker({ context, moduleName, resolution });
      return resolution;
    },
  },
});
