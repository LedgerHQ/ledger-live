import path from "node:path";
import { fileURLToPath } from "node:url";
// import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as Repack from "@callstack/repack";
import { ExpoModulesPlugin } from "@callstack/repack-plugin-expo-modules";
import { ReanimatedPlugin } from "@callstack/repack-plugin-reanimated";
import { DefinePlugin, NormalModuleReplacementPlugin } from "@rspack/core";
// import { cluster } from "node-libs-react-native";

const require = createRequire(import.meta.url);
const PnpmWorkspaceResolverPlugin = require("./plugins/PnpmWorkspaceResolverPlugin.js");
const NodeProtocolPlugin = require("./plugins/NodeProtocolPlugin.js");
const EthereumCryptographyResolverPlugin = require("./plugins/EthereumCryptographyResolverPlugin.js");

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
  externals: {
    // Prevent build tools from being bundled
    'tapable': 'commonjs tapable',
    'webpack': 'commonjs webpack',
    '@rspack/core': 'commonjs @rspack/core',
    '@babel/core': 'commonjs @babel/core',
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
      "reselect": require.resolve("reselect"), // Singleton: ensure only the app's version (v4) is used
      "asn1.js": require.resolve("asn1.js"), // Singleton: prevent multiple versions from conflicting
      "bn.js": require.resolve("bn.js"), // Singleton: BigNumber library used by ethereumjs
      "long": require.resolve("long"), // Singleton: 64-bit integer library used by @hashgraph/sdk
      "bip32": require.resolve("bip32"), // Singleton: Bitcoin BIP32 library - must NOT be transpiled to preserve getters
      "@ethereumjs/util": require.resolve("@ethereumjs/util"), // Singleton: force one version
      // ethereum-cryptography and @noble/* packages handled by EthereumCryptographyResolverPlugin
      // @chainsafe/as-sha256 uses WebAssembly which is not supported in Hermes, use js-sha256 instead
      "@chainsafe/as-sha256": require.resolve("js-sha256"),
      // Workspace package aliases for compiled code
      "@ledgerhq/crypto-icons": path.resolve(projectRootDir, "libs/ui/packages/crypto-icons"),
      "@ledgerhq/crypto-icons-ui": path.resolve(projectRootDir, "libs/ui/packages/crypto-icons"),
      "@ledgerhq/ui-shared": path.resolve(projectRootDir, "libs/ui/packages/shared"),
      // Force coin-kaspa to use TypeScript source to avoid module interop issues
      "@ledgerhq/coin-kaspa": path.resolve(projectRootDir, "libs/coin-modules/coin-kaspa/src/index.ts"),
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
      // CRITICAL: Replace tapable package with our polyfill
      // This must be an absolute path to bypass all module resolution
      "tapable": path.resolve(__dirname, "polyfills/tapable.js"),
      "tapable/lib/Hook": path.resolve(__dirname, "polyfills/tapable.js"),
      "tapable/lib/SyncHook": path.resolve(__dirname, "polyfills/tapable.js"),
      "tapable/lib/AsyncSeriesBailHook": path.resolve(__dirname, "polyfills/tapable.js"),
      "tapable/lib/AsyncSeriesWaterfallHook": path.resolve(__dirname, "polyfills/tapable.js"),
      // CRITICAL: Prevent build tools from being bundled (they should never be in runtime)
      "webpack": false,
      "@rspack/core": false,
      "@babel/core": false,
      "terser-webpack-plugin": false,
      "html-webpack-plugin": false,
    },
    fallback: {
      // tapable is used by Re.Pack's ScriptManager - provide React Native compatible polyfill
      "tapable": path.resolve(__dirname, "polyfills/tapable.js"),
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
      // readable-stream is used by some legacy packages but not needed in React Native
      // These subpath exports don't exist in newer versions, so we disable them
      "readable-stream": false,
      "readable-stream/duplex": false,
      "readable-stream/passthrough": false,
      "readable-stream/readable": false,
      "readable-stream/transform": false,
      "readable-stream/writable": false,
      // Flipper/Rozenite plugins are dev-only, make them optional
      "@rozenite/mmkv-plugin": false,
      "@rozenite/network-activity-plugin": false,
      "@rozenite/performance-monitor-plugin": false,
      "@rozenite/react-navigation-plugin": false,
      "@rozenite/redux-devtools-plugin": false,
      // Package export issues - these are dependencies of @aptos-labs and @solana
      "@aptos-labs/aptos-client": false,
      "rpc-websockets": false,
      // Old stream libraries that aren't needed
      "fwd-stream": false,
      "level-blobs": false,
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
          path.resolve(__dirname, "polyfills"),
          path.resolve(__dirname, "index.js"),
          path.resolve(projectRootDir, "libs"),
          // Re.Pack runtime modules (need transpilation)
          /node_modules\/@callstack\/repack\/dist\/modules/,
          // React Native core (has Flow types)
          /node_modules\/react-native\//,
          /node_modules\/@react-native\//,
        ],
        exclude: [
          // Exclude UI packages source files - use compiled lib/ instead
          /libs\/ui\/packages\/icons\/src\//,
          /libs\/ui\/packages\/native\/src\//,
          /libs\/ui\/packages\/crypto-icons\/src\//,
          /libs\/ui\/packages\/shared\/src\//,
        ],
        use: {
          loader: "@callstack/repack/babel-swc-loader",
          options: {
            babelrc: true,
            configFile: true,
            cacheDirectory: false,
            unstable_disableTransform: ["react-native-reanimated"],
            parallel: true,
            // Use SWC mode (default) - Polkadot static blocks are already patched
            // SWC with hermes-parser is faster and more compatible with React Native
            hideParallelModeWarning: true,
          },
        },
        type: "javascript/auto",
      },
      // Transpile ALL node_modules (Metro-like behavior)
      // This ensures compatibility with Hermes by transforming all modern ES features
      {
        test: /\.[cm]?[jt]sx?$/,
        include: [/node_modules/],
        exclude: [
          // Exclude known safe/pre-compiled packages for performance
          // These are packages that are already ES5 or don't use problematic features
          
          // Core React (already compatible)
          /node_modules\/react\/cjs\//,
          /node_modules\/react-dom\/cjs\//,
          /node_modules\/scheduler\/cjs\//,
          
          // Build tools (should NEVER be in bundle - these are bundler dependencies)
          /node_modules\/@babel\//,
          /node_modules\/@rspack\//,
          /node_modules\/@swc\//,
          /node_modules\/webpack/,
          /node_modules\/tapable/,
          /node_modules\/metro/,
          /node_modules\/typescript/,
          /node_modules\/eslint/,
          /node_modules\/jest/,
          /node_modules\/detox/,
          /node_modules\/@testing-library/,
          /node_modules\/terser/,
          /node_modules\/esbuild/,
          /node_modules\/html-webpack-plugin/,
          /node_modules\/@pmmmwh/,  // react-refresh-webpack-plugin
          
          // Dev-only tools (not in production bundle)
          /node_modules\/@storybook/,
          /node_modules\/prettier/,
          /node_modules\/rollup/,
          /node_modules\/vite/,
          /node_modules\/vitest/,
          /node_modules\/playwright/,
          
          // Large polyfill libraries that are already compatible
          /node_modules\/core-js\//,
          /node_modules\/regenerator-runtime\//,
          
          // TypeScript definition files
          /\.d\.ts$/,
        ],
        use: {
          loader: "@callstack/repack/babel-swc-loader",
          options: {
            babelrc: true,
            configFile: true,
            cacheDirectory: false,
            unstable_disableTransform: ["react-native-reanimated"],
            parallel: true,
            // Use SWC mode (default) - Polkadot static blocks are already patched
            hideParallelModeWarning: true,
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
    // CRITICAL: Replace tapable with our React Native polyfill FIRST
    // Re.Pack's ScriptManager uses tapable, but tapable is a Node.js library
    new NormalModuleReplacementPlugin(
      /tapable/,
      (resource) => {
        // Don't replace our own polyfill files
        if (resource.request.includes('polyfills/tapable') || 
            resource.request.includes('polyfills/setup-tapable')) {
          return;
        }
        // Log for debugging
        if (!isProduction) {
          console.log('[NormalModuleReplacementPlugin] Replacing tapable:', resource.request);
        }
        resource.request = path.resolve(__dirname, "polyfills/tapable.js");
      }
    ),
    // NodeProtocolPlugin MUST come first to intercept node: protocol before any resolution
    new NodeProtocolPlugin({
      verbose: !isProduction, // Enable verbose logging in development
    }),
    // EthereumCryptographyResolverPlugin forces ethereum-cryptography@1.2.0 for @ethereumjs/util compatibility
    new EthereumCryptographyResolverPlugin({
      verbose: !isProduction, // Enable verbose logging in development
    }),
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
