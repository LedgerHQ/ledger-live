/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */

const path = require("path");
const defaultSourceExts =
  require("metro-config/src/defaults/defaults").sourceExts;
const { makeMetroConfig } = require("@rnx-kit/metro-config");
const MetroSymlinksResolver = require("@rnx-kit/metro-resolver-symlinks");
const resolve = require("metro-resolver").resolve;

function forceDependency(moduleName, filters, nodeModulesPaths) {
  const matches = filters.some(
    (filter) => moduleName === filter || moduleName.startsWith(`${filter}/`)
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

module.exports = function (options = {}, config = {}) {
  const {
    // Root of the project
    projectRoot,
    // Dependencies that are forcefully resolved from the LLM folder.
    forcedDependencies = ["react-native"],
    // MetroSymlinksResolver remapModule option
    remapModule,
    // Gives to ability to hijack the resolver early on
    earlyResolver,
    // Guards against resolving globally installed packages
    globalPackagesGuard = true,
    // Useful callbacks
    callbackSymlinkResolution,
    callbackSymlinkResolutionError,
    callbackNodeResolution,
    callbackNodeResolutionError,
  } = options;
  // Emulate what the ./node_modules/.bin/react-native binary is doing by adding node_modules paths.
  // Needed because the react native prod build scripts call react-native/cli.js which does not set these paths.
  // They will serve as fallbacks when the node resolver used by MetroSymlinksResolver fails to resolve some modules.
  const nodeModulesPaths = [
    ...(projectRoot ? [path.resolve(projectRoot, "node_modules")] : []),
    path.resolve(__dirname, "..", "..", "node_modules"),
    path.resolve(
      __dirname,
      "..",
      "..",
      "node_modules",
      ".pnpm",
      "node_modules"
    ),
  ];

  function checkGlobalPackage(resolution) {
    if (
      globalPackagesGuard &&
      path
        .relative(path.resolve(__dirname, "..", ".."), resolution)
        .startsWith("..")
    ) {
      throw new Error("Global package resolution is not allowed", resolution);
    }
  }

  const symlinkResolver = MetroSymlinksResolver({
    remapModule: (context, moduleName, platform) => {
      if (remapModule) {
        return remapModule(context, moduleName, platform);
      }
      return moduleName;
    },
  });

  return makeMetroConfig({
    ...config,
    projectRoot,
    transformer: {
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
      ...config.transformer,
    },
    resolver: {
      nodeModulesPaths,
      resolveRequest: (context, moduleName, platform) => {
        try {
          if (earlyResolver) {
            const earlyResolution = earlyResolver(
              context,
              moduleName,
              platform
            );
            if (earlyResolution) return earlyResolution;
          }
          // pnpm hoists wrong versions when using the --frozen-lockfile argument.
          // So we forcefully use the right ones here from the LLM subfolder.
          try {
            const forcedResolution = forceDependency(
              moduleName,
              forcedDependencies,
              nodeModulesPaths
            );
            if (forcedResolution) return forcedResolution;
          } catch (_) {
            // ignore for now…
          }

          // Attempt to resolve using the symlink resolver.
          const resolution = symlinkResolver(context, moduleName, platform);
          // It could be useful to log the resolution here when debugging specific packages…
          if (callbackSymlinkResolution) {
            callbackSymlinkResolution({
              resolution,
              context,
              moduleName,
              platform,
            });
          }
          checkGlobalPackage(resolution.filePath);
          return resolution;
        } catch (error) {
          try {
            if (callbackSymlinkResolutionError) {
              callbackSymlinkResolutionError({
                error,
                context,
                moduleName,
                platform,
              });
            }
            // If the symlink resolver failed it is likely that the package.json has an "exports" field
            // which does not export the package.json path itself.
            // Another common cause of failure is when importing a nodejs stdlib module.
            // In that case we fallback to the good old require.resolve function.
            const resolution = require.resolve(moduleName, {
              paths: [
                path.dirname(context.originModulePath),
                ...nodeModulesPaths,
              ],
            });
            if (callbackNodeResolution) {
              callbackNodeResolution({
                resolution,
                context,
                moduleName,
                platform,
              });
            }
            if (path.isAbsolute(resolution)) {
              checkGlobalPackage(resolution);
              return {
                filePath: resolution,
                type: "sourceFile",
              };
            }
          } catch (error) {
            if (callbackNodeResolutionError) {
              callbackNodeResolutionError({
                error,
                context,
                moduleName,
                platform,
              });
            }
          }

          return context.resolveRequest(context, moduleName, platform);
        }
      },
      sourceExts: [...defaultSourceExts, "cjs"],
      ...config.resolver,
    },
  });
};

module.exports.duplicatesChecker = require("./duplicatesChecker");
