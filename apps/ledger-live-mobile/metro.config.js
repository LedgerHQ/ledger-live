/**
 * Metro configuration for React Native
 * https://reactnative.dev/docs/metro
 *
 * @format
 */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */

const { withRozenite } = require("@rozenite/metro");
const { withRozeniteReduxDevTools } = require("@rozenite/redux-devtools-plugin/metro");
const path = require("path");
const fs = require("fs");
const tsconfig = require("./tsconfig.json");

const forcedDependencies = [
  "react",
  "react-redux",
  "react-native",
  "react-native-svg",
  "styled-components",
  "react-native-reanimated",
  "react-native-worklets",
  "react-native-safe-area-context",
  "@tanstack/react-query",
  "react-native-linear-gradient",
  "@ledgerhq/lumen-ui-rnative",
  "@ledgerhq/lumen-design-core",
];

const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const removeStarPath = moduleName => moduleName.replace("/*", "");

const defaultConfig = getDefaultConfig(__dirname);

const buildTsAlias = (conf = {}) =>
  Object.keys(conf).reduce(
    (acc, moduleName) => ({
      ...acc,
      [removeStarPath(moduleName)]: path.resolve(__dirname, removeStarPath(conf[moduleName][0])),
    }),
    {},
  );

const projectRootDir = path.join(__dirname, "..", "..");
const featuresDir = path.join(projectRootDir, "features");

/**
 * Build dynamic aliases for all features in the features folder.
 * Maps @features/<name> to features/<name>/src for each feature.
 */
function buildFeaturesAliases() {
  const aliases = {};

  if (!fs.existsSync(featuresDir)) {
    return aliases;
  }

  const entries = fs.readdirSync(featuresDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const featureSrcPath = path.join(featuresDir, entry.name, "src");
      if (fs.existsSync(featureSrcPath)) {
        aliases[`@features/${entry.name}`] = featureSrcPath;
      }
    }
  }

  return aliases;
}

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
  // Explicitly watch the features folder for hot reloading
  // Metro will resolve .native.tsx/.native.ts files automatically for React Native
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
    assetExts: [
      ...new Set([...(defaultConfig.resolver?.assetExts ?? []), "lottie"]),
    ],
    extraNodeModules: {
      ...require("node-libs-react-native"),
      fs: require.resolve("react-native-level-fs"),
      net: require.resolve("react-native-tcp-socket"),
      tls: require.resolve("tls"),
      ...buildTsAlias(tsconfig.compilerOptions.paths),
      // @features/* aliases are dynamically generated for each feature
      ...buildFeaturesAliases(),
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

module.exports = withRozenite(mergeConfig(defaultConfig, metroConfig), {
  enabled: process.env.WITH_ROZENITE === "true",
  include: [
    "@rozenite/network-activity-plugin",
    "@rozenite/react-navigation-plugin",
    "@rozenite/redux-devtools-plugin",
    "@rozenite/mmkv-plugin",
  ],
  enhanceMetroConfig: config => withRozeniteReduxDevTools(config),
});
