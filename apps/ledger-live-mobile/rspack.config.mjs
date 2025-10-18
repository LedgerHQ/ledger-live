import path from "node:path";
import { fileURLToPath } from "node:url";
// import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as Repack from "@callstack/repack";
import { ExpoModulesPlugin } from "@callstack/repack-plugin-expo-modules";
import { ReanimatedPlugin } from "@callstack/repack-plugin-reanimated";
import { DefinePlugin } from "@rspack/core";
// import { cluster } from "node-libs-react-native";

const require = createRequire(import.meta.url);
const PnpmWorkspaceResolverPlugin = require("./plugins/PnpmWorkspaceResolverPlugin.js");

const __filename = fileURLToPath(import.meta.url);
const __dirname = Repack.getDirname(import.meta.url);
const projectRootDir = path.join(__dirname, "..", "..");
// const symLinksDir = path.join(projectRootDir, "node_modules", ".pnpm");

// Read tsconfig for path mappings
// const tsconfig = JSON.parse(readFileSync(path.join(__dirname, "./tsconfig.json"), "utf8"));

// const reactNativePath = new URL("./node_modules/react-native", import.meta.url).pathname;

// const forcedDependencies = [
//   "react-redux",
//   "react-native",
//   "react-native-svg",
//   "styled-components",
//   "react-native-reanimated",
//   "@tanstack/react-query",
//   "react-native-linear-gradient",
// ];

const nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(projectRootDir, "node_modules"),
];

// const buildTsAlias = conf =>
//   Object.keys(conf).reduce(
//     (acc, moduleName) => ({
//       ...acc,
//       [moduleName.replace("/*", "")]: path.resolve(
//         __dirname,
//         conf[moduleName][0].replace("/*", ""),
//       ),
//     }),
//     {},
//   );

const isProduction = process.env.NODE_ENV === "production";
// console.log(isProduction);
/**
 * Rspack configuration enhanced with Re.Pack defaults for React Native.
 *
 * Learn about Rspack configuration: https://rspack.dev/config/
 * Learn about Re.Pack configuration: https://re-pack.dev/docs/guides/configuration
 */

export default Repack.defineRspackConfig({
  context: __dirname,
  entry: "./index.js",
  mode: isProduction ? "production" : "development",
  devServer: {
    enabled: !isProduction,
    port: 8081,
    host: "localhost",
  },
  resolve: {
    ...Repack.getResolveOptions({ enablePackageExports: true }),
    modules: nodeModulesPaths,
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
    mainFields: ["react-native", "browser", "main"],
    conditionNames: ["require", "react-native", "browser"],
    symlinks: true,
    fullySpecified: false, // Allow imports without extensions
    fallback: {
      ...require("node-libs-react-native"),
      fs: require.resolve("react-native-level-fs"),
      net: require.resolve("react-native-tcp-socket"),
      tls: require.resolve("tls"),
      "@ledgerhq/ui-shared": "caca",
      child_process: false,
      cluster: false,
      dgram: false,
      dns: false,
      readline: false,
      module: false,
      repl: false,
      vm: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.[cm]?[jt]sx?$/,
        use: {
          loader: "@callstack/repack/babel-swc-loader",
          parallel: true,
          options: {
            babelrc: true,
            configFile: true,
            cacheDirectory: false,
          },
        },
        type: "javascript/auto",
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp)$/i,
        type: "asset/resource",
        generator: {
          filename: "assets/images/[name].[hash][ext]",
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
        generator: {
          filename: "assets/fonts/[name].[hash][ext]",
        },
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/i,
        type: "asset/resource",
        generator: {
          filename: "assets/videos/[name].[hash][ext]",
        },
      },
      {
        test: /\.json$/,
        type: "json",
      },
    ],
  },
  plugins: [
    new PnpmWorkspaceResolverPlugin({
      workspaceRoot: projectRootDir,
      verbose: !isProduction, // Enable verbose logging in development
    }),
    new DefinePlugin({
      __DEV__: JSON.stringify(!isProduction),
    }),
    new Repack.RepackPlugin({
      context: __dirname,
      mode: isProduction ? "production" : "development",
      devServer: {
        enabled: !isProduction,
        port: 8081,
        host: "localhost",
      },
      assets: [
        "./assets/fonts/",
        "./assets/videos/",
        "node_modules/@ledgerhq/native-ui/lib/assets/fonts/alpha",
        "node_modules/@ledgerhq/native-ui/lib/assets/fonts/inter",
      ],
    }),
    new ExpoModulesPlugin(),
    // new ReanimatedPlugin(),
  ],
  devtool: isProduction ? "source-map" : "source-map",
});
