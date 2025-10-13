import path from "node:path";
import * as Repack from "@callstack/repack";
import { ExpoModulesPlugin } from "@callstack/repack-plugin-expo-modules";
import { ReanimatedPlugin } from "@callstack/repack-plugin-reanimated";
import fs from "fs";
import { createRequire } from "module";

const __dirname = Repack.getDirname(import.meta.url);
const projectRootDir = path.join(__dirname, "..", "..");

// Create require function for ES module context
const require = createRequire(import.meta.url);

// For sourcemap, devtools etc.
const _isProduction = process.env.NODE_ENV === "production";

const nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(projectRootDir, "node_modules"),
  path.resolve(projectRootDir, "node_modules", ".pnpm"),
];

// Add all pnpm package directories to resolve paths
const pnpmPackagesPath = path.resolve(projectRootDir, "node_modules", ".pnpm");
const additionalResolvePaths = [];

if (fs.existsSync(pnpmPackagesPath)) {
  const pnpmDirs = fs
    .readdirSync(pnpmPackagesPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => path.resolve(pnpmPackagesPath, dirent.name, "node_modules"));

  additionalResolvePaths.push(...pnpmDirs);
}

/**
 * Rspack configuration enhanced with Re.Pack defaults for React Native.
 *
 * Learn about Rspack configuration: https://rspack.dev/config/
 * Learn about Re.Pack configuration: https://re-pack.dev/docs/guides/configuration
 */

export default Repack.defineRspackConfig(env => {
  const { mode, context = __dirname, platform } = env;
  const { getResolveOptions, getJsTransformRules, getAssetTransformRules, RepackPlugin } = Repack;

  return {
    context,
    mode,
    entry: "./index.js",
    resolve: {
      ...getResolveOptions({ enablePackageExports: true }),
      extensions: [".js", ".jsx", ".ts", ".tsx", ".json", ".mjs"],
      alias: {
        "@": path.join(context, "./src"),
        LLM: path.join(context, "./src/newArch"),
        "@tests": path.join(context, "./__tests__"),
        "@mocks": path.join(context, "./__mocks__"),
      },
      preferRelative: true,
      mainFields: ["react-native", "browser", "main"],
      modules: [...nodeModulesPaths, ...additionalResolvePaths],
      symlinks: false,
      conditionNames: ["react-native", "browser", "import", "require"],
    },
    resolveLoader: {
      symlinks: false,
      modules: [...nodeModulesPaths, ...additionalResolvePaths],
      extensions: [".js", ".jsx", ".ts", ".tsx", ".json", ".mjs", ".h"],
    },

    module: {
      rules: [
        ...getJsTransformRules(),
        ...getAssetTransformRules(),
        // {
        //   test: /\.[cm]?[jt]sx?$/,
        //   exclude: [/node_modules/],
        //   use: {
        //     loader: "babel-loader",
        //     parallel: true,
        //     options: {
        //       configFile: path.join(context, "babel.config.js"),
        //     },
        //   },
        //   //type: "javascript/auto",
        // },
        {
          test: Repack.getAssetExtensionsRegExp(
            Repack.ASSET_EXTENSIONS.filter(ext => ext !== "svg"),
          ),
          include: [path.join(context, "./assets/fonts")],
          use: "@callstack/repack/assets-loader",
        },
        // {
        //   test: Repack.getAssetExtensionsRegExp(
        //     Repack.ASSET_EXTENSIONS.filter(ext => ext !== "svg"),
        //   ),
        //   include: [path.join(context, "assets/images")],
        //   use: {
        //     loader: "@callstack/repack/assets-loader",
        //     options: { inline: true },
        //   },
        // },
      ],
    },
    plugins: [
      new RepackPlugin(),
      new ExpoModulesPlugin(),
      new ReanimatedPlugin({
        unstable_disableTransform: true,
      }),
    ],
  };
});
