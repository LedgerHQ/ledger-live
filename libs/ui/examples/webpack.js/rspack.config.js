const path = require("path");
const rspack = require("@rspack/core");
const ReactRefreshPlugin = require("@rspack/plugin-react-refresh");

const isDev = process.env.NODE_ENV !== "production";

/** @type {import('@rspack/core').Configuration} */
module.exports = {
  mode: isDev ? "development" : "production",
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
    publicPath: "/",
    clean: true,
  },
  devtool: isDev ? "eval-source-map" : "source-map",
  resolve: {
    extensions: [".js", ".jsx"],
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        loader: "builtin:swc-loader",
        options: {
          jsc: {
            parser: {
              syntax: "ecmascript",
              jsx: true,
            },
            transform: {
              react: {
                runtime: "classic",
                development: isDev,
                refresh: isDev,
              },
            },
          },
        },
        type: "javascript/auto",
      },
      {
        test: /\.woff2$/,
        type: "asset/resource",
        generator: {
          filename: "assets/fonts/[name].woff2",
        },
      },
    ],
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: "./src/index.ejs",
    }),
    isDev && new ReactRefreshPlugin(),
  ].filter(Boolean),
  devServer: {
    port: 9000,
    hot: true,
    compress: true,
  },
  experiments: {
    css: true,
  },
};
