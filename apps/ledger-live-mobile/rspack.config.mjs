import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import fs from "fs";
import TerserPlugin from "terser-webpack-plugin";
import * as Repack from "@callstack/repack";
import rspack from "@rspack/core";
import { ExpoModulesPlugin } from "@callstack/repack-plugin-expo-modules";
import { ReanimatedPlugin } from "@callstack/repack-plugin-reanimated";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Load tsconfig paths for alias resolution
const tsconfig = JSON.parse(fs.readFileSync(path.join(__dirname, "tsconfig.json"), "utf-8"));

const projectRootDir = path.join(__dirname, "..", "..");

// Build TypeScript aliases
const buildTsAlias = (conf = {}) =>
  Object.keys(conf).reduce(
    (acc, moduleName) => ({
      ...acc,
      [moduleName.replace("/*", "")]: path.resolve(
        __dirname,
        conf[moduleName][0].replace("/*", ""),
      ),
    }),
    {},
  );

// Node.js polyfills configuration
// Using a simpler approach - let webpack/rspack resolve polyfills dynamically
const nodePolyfills = {
  assert: require.resolve("assert"),
  buffer: require.resolve("buffer"),
  console: require.resolve("console-browserify"),
  constants: require.resolve("constants-browserify"),
  crypto: require.resolve("crypto-browserify"),
  domain: require.resolve("domain-browser"),
  events: require.resolve("events"),
  http: require.resolve("stream-http"),
  https: require.resolve("https-browserify"),
  os: require.resolve("os-browserify/browser"),
  path: require.resolve("path-browserify"),
  punycode: require.resolve("punycode"),
  process: require.resolve("process/browser"),
  querystring: require.resolve("querystring-es3"),
  stream: require.resolve("readable-stream"),
  string_decoder: require.resolve("string_decoder"),
  sys: require.resolve("util"),
  timers: require.resolve("timers-browserify"),
  tty: require.resolve("tty-browserify"),
  url: require.resolve("url"),
  util: require.resolve("util"),
  vm: require.resolve("vm-browserify"),
  zlib: require.resolve("browserify-zlib"),

  // Custom overrides for React Native
  fs: require.resolve("react-native-level-fs"),
  net: require.resolve("react-native-tcp-socket"),

  // Empty modules (explicitly set to false)
  tls: false,
  http2: false,
  dns: false,
  child_process: false,
  cluster: false,
  dgram: false,
  module: false,
  readline: false,
  repl: false,
};

// Forced dependencies for monorepo consistency (reserved for future use)
// const _forcedDependencies = [
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
];

/**
 * @type {import('@callstack/repack').RspackPlugin}
 */
export default env => {
  const {
    mode = "development",
    context = __dirname,
    entry = "./index.js",
    platform = process.env.PLATFORM,
    minimize = mode === "production",
    devServer = undefined,
    bundleFilename = undefined,
    sourceMapFilename = undefined,
    assetsPath = undefined,
  } = env;

  const isProd = mode === "production";
  const isDev = mode === "development";

  return {
    mode,
    devtool: isDev ? "cheap-module-source-map" : "source-map",
    context,
    entry,
    resolve: {
      // Enable symlinks for pnpm workspace
      symlinks: true,

      // TypeScript path aliases + custom aliases
      alias: {
        ...buildTsAlias(tsconfig.compilerOptions.paths),
        // Additional aliases if needed
      },

      // Node.js polyfills
      fallback: nodePolyfills,

      // Module resolution order
      mainFields: ["react-native", "browser", "main"],

      // Supported extensions
      extensions: [
        `.${platform}.tsx`,
        `.${platform}.ts`,
        `.${platform}.jsx`,
        `.${platform}.js`,
        ".tsx",
        ".ts",
        ".jsx",
        ".js",
        ".json",
      ],

      // Custom module paths for monorepo
      modules: ["node_modules", ...nodeModulesPaths],

      // Enable package.json exports field
      conditionNames: ["require", "react-native", "browser"],
      exportsFields: ["exports"],

      // Allow imports without file extensions (fixes third-party package warnings)
      fullySpecified: false,
    },
    output: {
      clean: true,
      hashFunction: "xxhash64",
      path: path.join(__dirname, "build", platform),
      filename: "index.bundle",
      chunkFilename: "[name].chunk.bundle",
      uniqueName: "ledger-live-mobile",
    },
    optimization: {
      minimize,
      minimizer: [
        new TerserPlugin({
          test: /\.(jsx?|tsx?)$/,
          extractComments: false,
          terserOptions: {
            compress: {
              drop_console: isProd,
              passes: 3,
            },
            format: {
              comments: false,
            },
          },
        }),
      ],
      // Enable code splitting (optional - can be enabled later)
      // chunkIds: "named",
      // splitChunks: {
      //   chunks: "all",
      //   cacheGroups: {
      //     vendor: {
      //       test: /[\\/]node_modules[\\/]/,
      //       name: "vendor",
      //       priority: -10,
      //     },
      //     families: {
      //       test: /[\\/]src[\\/]families[\\/]/,
      //       name(module) {
      //         const match = module.context.match(/families[\\/]([^[\\/]]+)/);
      //         return match ? `family-${match[1]}` : "families";
      //       },
      //       priority: -5,
      //     },
      //   },
      // },
    },
    module: {
      rules: [
        // React Native and TypeScript
        {
          test: /\.[jt]sx?$/,
          exclude: /node_modules(?!\/(@react-native|@react-navigation|react-native|@ledgerhq))/,
          use: {
            loader: "builtin:swc-loader",
            options: {
              jsc: {
                parser: {
                  syntax: "typescript",
                  tsx: true,
                  decorators: true,
                  dynamicImport: true,
                },
                externalHelpers: true,
                transform: {
                  react: {
                    runtime: "automatic",
                    development: isDev,
                    refresh: isDev,
                  },
                },
                target: "es2015",
              },
              env: {
                targets: {
                  ios: "13",
                  android: "5",
                },
                mode: "usage",
                coreJs: "3.30",
              },
            },
          },
        },
        // Images and assets
        {
          test: Repack.getAssetExtensionsRegExp(
            Repack.ASSET_EXTENSIONS.filter(ext => ext !== "svg"),
          ),
          use: {
            loader: "@callstack/repack/assets-loader",
            options: {
              platform,
              devServerEnabled: Boolean(devServer),
              scalableAssetExtensions: Repack.SCALABLE_ASSETS,
            },
          },
        },
        // SVG support
        {
          test: /\.svg$/,
          use: [
            {
              loader: "@svgr/webpack",
              options: {
                native: true,
              },
            },
          ],
        },
      ],
    },
    plugins: [
      // Repack core plugin
      new Repack.RepackPlugin({
        context,
        mode,
        platform,
        devServer,
        output: {
          bundleFilename,
          sourceMapFilename,
          assetsPath,
        },
      }),

      // Expo modules plugin
      new ExpoModulesPlugin(),

      // Reanimated plugin
      new ReanimatedPlugin(),

      // Module Federation plugin (disabled for initial migration)
      // TODO: Enable after basic Re.Pack migration is stable
      // new Repack.plugins.ModuleFederationPluginV2({
      //   name: "ledgerLiveMobile",
      // }),

      // Environment variables
      new rspack.DefinePlugin({
        __DEV__: JSON.stringify(isDev),
        "process.env.NODE_ENV": JSON.stringify(mode),
      }),

      // Sentry plugin (conditional on production builds)
      ...(isProd && process.env.SENTRY_AUTH_TOKEN
        ? [
            // TODO: Add Sentry webpack plugin
            // Requires migration from @sentry/react-native/metro to webpack plugin
          ]
        : []),

      // Rozenite plugins (conditional on dev mode)
      ...(isDev && process.env.WITH_ROZENITE === "true"
        ? [
            // TODO: Configure Rozenite for Re.Pack
            // May require updates to Rozenite packages
          ]
        : []),
    ],
  };
};
