const path = require("path");
const { HtmlRspackPlugin } = require("@rspack/core");
const ReactRefreshPlugin = require("@rspack/plugin-react-refresh");

const isDevelopment = process.env.NODE_ENV !== "production";

/** @type {import("@rspack/core").Configuration} */
module.exports = {
  mode: isDevelopment ? "development" : "production",
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
    clean: true,
  },
  devtool: isDevelopment ? "eval-source-map" : "source-map",
  target: "web",
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
                runtime: "automatic",
                development: isDevelopment,
                refresh: isDevelopment,
              },
            },
          },
        },
        type: "javascript/auto",
      },
      {
        test: /\.woff2/,
        type: "asset/resource",
        generator: {
          filename: "assets/fonts/[name].woff2",
        },
      },
    ],
  },
  plugins: [new HtmlRspackPlugin(), isDevelopment && new ReactRefreshPlugin()].filter(Boolean),
  devServer: isDevelopment
    ? {
        compress: true,
        port: 9000,
        hot: true,
      }
    : undefined,
};
