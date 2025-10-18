/* eslint-disable @typescript-eslint/no-var-requires */
const { RepackPlugin, getResolveOptions, getAssetTransformRules } = require("@callstack/repack");
const { ExpoModulesPlugin } = require("@callstack/repack-plugin-expo-modules");
const { ReanimatedPlugin } = require("@callstack/repack-plugin-reanimated");
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const webpack = require("webpack");
const tsconfig = require("./tsconfig.json");

const appDir = __dirname;
const projectRootDir = path.join(appDir, "..", "..");
const symLinksDir = path.join(projectRootDir, "node_modules", ".pnpm");

const forcedDependencies = [
  "react-redux",
  "react-native",
  "react-native-svg",
  "styled-components",
  "react-native-reanimated",
  "@tanstack/react-query",
  "react-native-linear-gradient",
];

// Helper function to safely resolve dependencies
const safeResolve = (dep, paths = nodeModulesPaths) => {
  try {
    return require.resolve(dep, { paths });
  } catch (e) {
    console.warn(`Could not resolve dependency: ${dep}`);
    return false;
  }
};

const nodeModulesPaths = [
  path.resolve(appDir, "node_modules"),
  path.resolve(projectRootDir, "node_modules"),
  path.resolve(symLinksDir),
];

const buildTsAlias = conf =>
  Object.keys(conf).reduce(
    (acc, moduleName) => ({
      ...acc,
      [moduleName.replace("/*", "")]: path.resolve(appDir, conf[moduleName][0].replace("/*", "")),
    }),
    {},
  );

const IS_PROD = process.env.NODE_ENV === "production";

const config = {
  mode: IS_PROD ? "production" : "development",

  entry: "./index.js",

  resolve: {
    ...getResolveOptions(),
    symlinks: true,
    fullySpecified: false, // Allow imports without extensions
    preferRelative: false, // Prefer absolute imports over relative

    modules: nodeModulesPaths,
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],

    mainFields: ["react-native", "browser", "main"],

    conditionNames: ["require", "react-native", "browser"],

    alias: {
      ...buildTsAlias(tsconfig.compilerOptions.paths),
      ...forcedDependencies.reduce((acc, dep) => {
        const resolved = safeResolve(dep);
        if (resolved) {
          acc[dep] = resolved;
        }
        return acc;
      }, {}),
      fs: safeResolve("react-native-level-fs") || false,
      net: safeResolve("react-native-tcp-socket") || false,
      tls: false,
      http2: false,
      dns: false,
    },

    fallback: {
      fs: safeResolve("react-native-level-fs") || false,
      net: safeResolve("react-native-tcp-socket") || false,
      tls: false,
      http2: false,
      dns: false,
      child_process: false,
      crypto: safeResolve("react-native-fast-crypto") || false,
      buffer: safeResolve("buffer") || false,
      util: safeResolve("util") || false,
      assert: safeResolve("assert") || false,
      url: safeResolve("url") || false,
      events: safeResolve("events") || false,
      // Add missing dependencies with safe resolution
      shallowequal: safeResolve("shallowequal") || false,
      tapable: safeResolve("tapable") || false,
      "@tanstack/query-core": safeResolve("@tanstack/query-core") || false,
      // React Native internal modules
      "react-native/Libraries/Image/AssetRegistry": false,
      "react-native/Libraries/Image/AssetSourceResolver": false,
      "react-native/Libraries/NativeModules/specs/NativeRedBox": false,
      "react-native/Libraries/Utilities/DevLoadingView": false,
    },
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        use: {
          loader: "babel-loader",
          options: {
            babelrc: false,
            presets: [
              "module:@react-native/babel-preset",
              ["@babel/preset-react", { runtime: "automatic" }],
            ],
            plugins: [
              "@babel/plugin-transform-named-capturing-groups-regex",
              "@babel/plugin-transform-export-namespace-from",
              "@babel/plugin-transform-class-static-block",
              "@babel/plugin-transform-flow-strip-types",
              ["@babel/plugin-transform-private-methods", { loose: true }],
              "babel-plugin-transform-inline-environment-variables",
              "react-native-reanimated/plugin",
            ],
            cacheDirectory: false,
          },
        },
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
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(!IS_PROD),
    }),

    new RepackPlugin({
      context: appDir,
      mode: IS_PROD ? "production" : "development",
      devServer: {
        enabled: !IS_PROD,
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

  // que veut-on? => faire un doc sur toutes les options de webpack et choisir
  // https://webpack.js.org/configuration/optimization/
  optimization: {
    minimize: IS_PROD,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
          },
          mangle: true,
        },
        extractComments: false,
      }),
    ],
    splitChunks: false,
  },

  // choisir ce qu'on veut (source-map sûr pour la prod)
  // https://webpack.js.org/configuration/devtool/
  devtool: IS_PROD ? "source-map" : "source-map",

  // Handle pnpm symlink issues
  watchOptions: {
    ignored: /node_modules\/\.pnpm/,
    followSymlinks: false,
  },

  // Add resolveLoader configuration
  resolveLoader: {
    modules: nodeModulesPaths,
  },
};

module.exports = config;
