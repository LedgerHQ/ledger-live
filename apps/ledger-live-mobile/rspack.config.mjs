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
  path.resolve(projectRootDir, "node_modules", ".pnpm"),
  // Add common pnpm peer dependency patterns
  path.resolve(projectRootDir, "node_modules", ".pnpm", "node_modules"),
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
    // Don't override extensions - Re.Pack handles platform-specific extensions via .[platform].js
    mainFields: ["react-native", "browser", "module", "main"],
    conditionNames: ["react-native", "require", "import", "default"],
    symlinks: true,
    preferRelative: true, // Prefer relative resolution for pnpm structure
    fullySpecified: false, // Allow imports without extensions
    alias: {
      react: require.resolve("react"),
      "react-native": require.resolve("react-native"),
      "react-native-svg": require.resolve("react-native-svg"),
      "react-native-reanimated": require.resolve("react-native-reanimated"),
      "styled-components": require.resolve("styled-components"),
      "react-redux": require.resolve("react-redux"),
      // Workspace package aliases for compiled code
      "@ledgerhq/crypto-icons": path.resolve(projectRootDir, "libs/ui/packages/crypto-icons"),
      "@ledgerhq/crypto-icons-ui": path.resolve(projectRootDir, "libs/ui/packages/crypto-icons"),
      "@ledgerhq/ui-shared": path.resolve(projectRootDir, "libs/ui/packages/shared"),
      // Fix @ledgerhq/live-common subpath imports that aren't in package exports
      "@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency": path.resolve(
        projectRootDir,
        "libs/ledger-live-common/src/modularDrawer/hooks/useAcceptedCurrency.ts"
      ),
      "@ledgerhq/live-common/modularDrawer/hooks/useNetworkAccountCounts": path.resolve(
        projectRootDir,
        "libs/ledger-live-common/src/modularDrawer/hooks/useNetworkAccountCounts.tsx"
      ),
      // TypeScript path aliases
      "~": path.resolve(__dirname, "src"),
      LLM: path.resolve(__dirname, "src/newArch"),
      "@tests": path.resolve(__dirname, "__tests__"),
      "@mocks": path.resolve(__dirname, "__mocks__"),
      // React Native internal modules - map to absolute paths to fix relative import issues
      "react-native/Libraries": path.join(require.resolve("react-native/package.json"), "../Libraries"),
    },
    fallback: {
      ...require("node-libs-react-native"),
      fs: require.resolve("react-native-level-fs"),
      net: require.resolve("react-native-tcp-socket"),
      tls: false,
      http2: false,
      dns: false,
      child_process: false,
      cluster: false,
      dgram: false,
      readline: false,
      module: false,
      repl: false,
      vm: false,
      // Flipper/Rozenite plugins are dev-only, make them optional
      "@rozenite/mmkv-plugin": false,
      "@rozenite/network-activity-plugin": false,
      "@rozenite/performance-monitor-plugin": false,
      "@rozenite/react-navigation-plugin": false,
      "@rozenite/redux-devtools-plugin": false,
      // Package export issues - these are dependencies of @aptos-labs and @solana
      "@aptos-labs/aptos-client": false,
      "rpc-websockets": false,
    },
  },
  module: {
    rules: [
      // Transpile React Native and workspace sources
      {
        test: /\.[cm]?[jt]sx?$/,
        include: [
          // App and workspace sources
          path.resolve(__dirname, "src"),
          path.resolve(__dirname, "e2e"),
          path.resolve(__dirname, "services"),
          path.resolve(__dirname, "index.js"),
          path.resolve(projectRootDir, "libs"),
          // Re.Pack runtime modules (need transpilation)
          /node_modules\/@callstack\/repack\/dist\/modules/,
          // React Native core (has Flow types)
          /node_modules\/react-native\//,
          /node_modules\/@react-native\//,
        ],
        use: {
          loader: "@callstack/repack/babel-swc-loader",
          options: {
            babelrc: true,
            configFile: true,
            cacheDirectory: false,
            unstable_disableTransform: ["react-native-reanimated"],
            parallel: true,
          },
        },
        type: "javascript/auto",
      },
      // Transpile specific node_modules that need it (ESM, TS enums, etc.)
      {
        test: /\.[cm]?[jt]sx?$/,
        include: [
          /node_modules\/@ledgerhq\//,
          /node_modules\/react-native-/,
          /node_modules\/@react-native-community\//,
          /node_modules\/@react-native-async-storage\//,
          /node_modules\/@react-native-masked-view\//,
          /node_modules\/@react-navigation\//,
          /node_modules\/@reduxjs\//,
          /node_modules\/@tanstack\//,
          /node_modules\/d3-/,
          /node_modules\/lodash-es\//,
          /node_modules\/@sentry\//,
          /node_modules\/@gorhom\//,
          /node_modules\/@braze\//,
          /node_modules\/@datadog\//,
          /node_modules\/@formatjs\//,
          /node_modules\/@segment\//,
          /node_modules\/@shopify\//,
          /node_modules\/expo(-|@|\/)/,
          /node_modules\/fuse\.js\//,
          /node_modules\/hoist-non-react-statics\//,
          /node_modules\/invariant\//,
          /node_modules\/jotai\//,
          /node_modules\/json-rpc-2\.0\//,
          /node_modules\/lottie-react-native\//,
          /node_modules\/prop-types\//,
          /node_modules\/react-is\//,
          /node_modules\/reselect\//,
          /node_modules\/redux-actions\//,
          /node_modules\/rxjs\//,
          /node_modules\/styled-components\//,
          /node_modules\/styled-system\//,
          /node_modules\/uuid\//,
          /node_modules\/react-freeze\//,
          /node_modules\/rn-range-slider\//,
          /node_modules\/rn-fetch-blob\//,
          /node_modules\/storyly-react-native\//,
          /node_modules\/@aptos-labs\//,
          /node_modules\/@solana\//,
        ],
        use: {
          loader: "@callstack/repack/babel-swc-loader",
          options: {
            babelrc: true,
            configFile: true,
            cacheDirectory: false,
            unstable_disableTransform: ["react-native-reanimated"],
            parallel: true,
          },
        },
        type: "javascript/auto",
      },
      {
        test: /\.svg$/,
        issuer: /\.[jt]sx?$/,
        use: [
          {
            loader: "@svgr/webpack",
            options: {
              native: true,
            },
          },
        ],
      },
      {
        test: /\.(png|jpe?g|gif|webp)$/i,
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
    new ReanimatedPlugin(),
  ],
  devtool: isProduction ? "hidden-source-map" : "cheap-module-source-map",
});
