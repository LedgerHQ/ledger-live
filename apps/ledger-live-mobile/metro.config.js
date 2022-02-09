/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */

const path = require("path");
const defaultSourceExts = require("metro-config/src/defaults/defaults")
  .sourceExts;
const { makeMetroConfig } = require("@rnx-kit/metro-config");
const MetroSymlinksResolver = require("@rnx-kit/metro-resolver-symlinks");

// Emulate what the ./node_modules/.bin/react-native binary is doing by adding node_modules paths.
// Needed because the react native prod build scripts call react-native/cli.js which does not set these paths.
// They will serve as fallbacks when the node resolver used by MetroSymlinksResolver fails to resolve some modules.
const nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(__dirname, "..", "..", "node_modules"),
  path.resolve(__dirname, "..", "..", "node_modules", ".pnpm", "node_modules"),
];

// Dependencies that are forcefully resolved from the LLM folder.
const FORCED_DEPENDENCIES = ["react-native"];

function forceDependency(moduleName, filters) {
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

const symlinkResolver = MetroSymlinksResolver({
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
});

const config = {
  projectRoot: __dirname,
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    nodeModulesPaths,
    extraNodeModules: {
      ...require("node-libs-react-native"),
      fs: require.resolve("react-native-level-fs"),
      net: require.resolve("react-native-tcp"),
    },
    // makeMetroConfig adds the "module" field, but we skip it here on purpose
    // because it makes the "react-native-url-polyfill" package consume the
    // es6 version of the "punycode" package and crash (it expects a default export).
    resolverMainFields: ["browser", "main"],
    // MetroSymlinksResolver resolves symlinked dependencies which makes metro play along nice with pnpm.
    // In practice, it is just a bit more complicated than that unfortunately…
    resolveRequest: (context, realModuleName, platform, moduleName) => {
      try {
        // pnpm hoists a wrong versions when using the --frozen-lockfile argument.
        // So we forcefully use the right ones here from the LLM subfolder.
        const forcedResolution = forceDependency(
          moduleName,
          FORCED_DEPENDENCIES,
        );
        if (forcedResolution) return forcedResolution;

        // Attempt to resolve using the symlink resolver.
        const resolution = symlinkResolver(context, moduleName, platform);
        // It could be useful to log the resolution here when debugging specific packages…
        return resolution;
      } catch (error) {
        // If the symlink resolver failed it is likely that the package.json has an "exports" field
        // which does not export the package.json path itself.
        // Another common cause of failure is when importing a nodejs stdlib module.
        // In that case we fallback to the good old require.resolve function.
        const resolution = require.resolve(moduleName, {
          paths: [path.dirname(context.originModulePath), ...nodeModulesPaths],
        });
        if (resolution.startsWith("/")) {
          return {
            filePath: resolution,
            type: "sourceFile",
          };
        }
        return null;
      }
    },
    sourceExts: [...defaultSourceExts, "cjs"],
  },
};

module.exports = makeMetroConfig(config);
