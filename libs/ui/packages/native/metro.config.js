/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */

const path = require("path");
const projectRootDir = path.join(__dirname, "..", "..", "..", "..");

const nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(projectRootDir, "node_modules"),
  path.resolve(projectRootDir, "node_modules", ".pnpm"),
];

module.exports = {
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
    resolverMainFields: ["sbmodern", "typescriptMain", "react-native", "browser", "main"],
    extraNodeModules: {
      assert: require.resolve("assert/"),
      util: require.resolve("util/"),
    },
    resolveRequest: (context, moduleName, platform) => {
      // Suppress source map warnings for @celo/contractkit
      if (moduleName.includes("@celo/contractkit") && moduleName.endsWith(".map")) {
        return { type: "empty" };
      }

      let resolution;
      // Necessary because expo removed the ability to override package.json main field…
      if (moduleName === "./lib/index") {
        resolution = context.resolveRequest(context, "./index", platform);
      } else {
        resolution = context.resolveRequest(context, moduleName, platform);
      }
      return resolution;
    },
  },
};
