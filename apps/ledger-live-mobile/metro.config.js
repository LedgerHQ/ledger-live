/**
 * Metro configuration for React Native
 * https://reactnative.dev/docs/metro
 *
 * @format
 */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */

const { withRozenite } = require("@rozenite/metro");
const { withRozeniteExpoAtlasPlugin } = require("@rozenite/expo-atlas-plugin");
const { withRozeniteReduxDevTools } = require("@rozenite/redux-devtools-plugin/metro");
const path = require("path");
const tsconfig = require("./tsconfig.json");

const forcedDependencies = [
  "react-redux",
  "react-native",
  "react-native-svg",
  "styled-components",
  "react-native-reanimated",
  "react-native-safe-area-context",
  "@tanstack/react-query",
  "react-native-linear-gradient",
];

const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const { withSentryConfig } = require("@sentry/react-native/metro");
const { createSerializer } = require("react-native-bundle-discovery");
const removeStarPath = moduleName => moduleName.replace("/*", "");

const buildTsAlias = (conf = {}) =>
  Object.keys(conf).reduce(
    (acc, moduleName) => ({
      ...acc,
      [removeStarPath(moduleName)]: path.resolve(__dirname, removeStarPath(conf[moduleName][0])),
    }),
    {},
  );

const projectRootDir = path.join(__dirname, "..", "..");

function forceDependency(moduleName, filters, nodeModulesPaths) {
  const matches = filters.some(
    filter => moduleName === filter || moduleName.startsWith(`${filter}/`),
  );
  if (matches) {
    const resolution = require.resolve(moduleName, {
      paths: nodeModulesPaths,
    });

    return {
      filePath: resolution,
      type: "sourceFile",
    };
  }

  return null;
}

const nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(projectRootDir, "node_modules"),
  path.resolve(projectRootDir, "node_modules", ".pnpm"),
];

const bundleDiscoverySerializer = createSerializer({
  includeCode: false,
  projectRoot: path.resolve(__dirname),
});

const metroConfig = {
  projectRoot: path.resolve(__dirname),
  watchFolders: [projectRootDir],
  serializer: {
    customSerializer: bundleDiscoverySerializer,
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    minifierConfig: {
      compress: {
        drop_console: true,
      },
    },
  },
  resolver: {
    unstable_enableSymlinks: true,
    unstable_enablePackageExports: true,
    unstable_conditionNames: ["require", "react-native", "browser"],
    nodeModulesPaths,
    resolverMainFields: ["react-native", "browser", "main"],
    extraNodeModules: {
      ...require("node-libs-react-native"),
      fs: require.resolve("react-native-level-fs"),
      net: require.resolve("react-native-tcp-socket"),
      tls: require.resolve("tls"),
      ...buildTsAlias(tsconfig.compilerOptions.paths),
    },
    resolveRequest: (context, moduleName, platform) => {
      if (["tls", "http2", "dns"].includes(moduleName)) {
        return { type: "empty" };
      }

      try {
        const forcedResolution = forceDependency(moduleName, forcedDependencies, nodeModulesPaths);
        if (forcedResolution) return forcedResolution;
      } catch (e) {
        console.log(e);
      }

      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = withRozenite(
  withSentryConfig(mergeConfig(getDefaultConfig(__dirname), metroConfig)),
  {
    enabled: process.env.WITH_ROZENITE === "true",
    include: [
      "@rozenite/network-activity-plugin",
      "@rozenite/expo-atlas-plugin",
      "@rozenite/react-navigation-plugin",
      "@rozenite/redux-devtools-plugin",
      "@rozenite/mmkv-plugin",
    ],
    enhanceMetroConfig: config =>
      withRozeniteExpoAtlasPlugin(config).then(config => withRozeniteReduxDevTools(config)),
  },
);
