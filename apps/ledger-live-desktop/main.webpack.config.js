const path = require("path");
const babelPlugins = require("./babel.plugins");
const UnusedWebpackPlugin = require("unused-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

const babelConfig = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "current",
        },
      },
    ],
    "@babel/preset-flow",
  ],
  plugins: babelPlugins,
};

const babelTsConfig = {
  presets: [
    "@babel/preset-typescript",
    [
      "@babel/preset-env",
      {
        targets: {
          electron: "7.1.9",
        },
      },
    ],
    "@babel/preset-react",
    "@babel/preset-flow",
  ],
  plugins: [
    ...babelPlugins,
    [
      "babel-plugin-styled-components",
      {
        ssr: false,
      },
    ],
  ],
};

module.exports = {
  stats: "errors-only",
  target: "electron-main",
  optimization: {
    minimize: false,
  },
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, ".webpack"),
    filename: "main.bundle.js",
  },
  plugins: [
    new UnusedWebpackPlugin({
      directories: [path.join(__dirname, "src/main"), path.join(__dirname, "src/internal")],
      exclude: ["*.test.js", "*.html", "updater/*"],
    }),
    new CopyPlugin({
      patterns: [{ from: path.join(__dirname, "build/icons"), to: "build/icons" }],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/i,
        loader: "babel-loader",
        exclude: /node_modules/,
        options: babelConfig,
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        loader: "file-loader",
        options: {
          name: "[path][name].[ext]",
        },
      },
    ],
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "src"),
    },
  },
};
