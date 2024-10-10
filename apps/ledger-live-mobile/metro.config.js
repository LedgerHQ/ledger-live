/**
 * Metro configuration for React Native
 * https://reactnative.dev/docs/metro
 *
 * @format
 */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */

const path = require("path");
const tsconfig = require("./tsconfig.json");

const forcedDependencies = [
  "react-redux",
  "react-native",
  "react-native-svg",
  "styled-components",
  "react-native-reanimated",
];

const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

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

const metroConfig = {
  projectRoot: path.resolve(__dirname),
  watchFolders: [projectRootDir],
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
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

module.exports = mergeConfig(getDefaultConfig(__dirname), metroConfig);
