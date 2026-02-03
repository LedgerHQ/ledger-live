/* eslint-env node */
/* eslint-disable @typescript-eslint/no-require-imports */

const path = require("path");
const rspack = require("@rspack/core");

const isDev = process.env.NODE_ENV !== "production";

/** @type {import('@rspack/core').Configuration} */
module.exports = {
  mode: isDev ? "development" : "production",
  entry: "./src/index.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "static/js/[name].[contenthash:8].js",
    publicPath: "/",
    clean: true,
  },
  devtool: isDev ? "eval-source-map" : "source-map",
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
    fullySpecified: false,
    fallback: {
      buffer: require.resolve("buffer/"),
    },
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        loader: "builtin:swc-loader",
        options: {
          jsc: {
            parser: {
              syntax: "typescript",
              tsx: true,
            },
            transform: {
              react: {
                runtime: "automatic",
                development: isDev,
              },
            },
          },
        },
        type: "javascript/auto",
      },
      {
        test: /\.css$/,
        type: "css",
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: "asset/resource",
        generator: {
          filename: "static/media/[name].[hash:8][ext]",
        },
      },
    ],
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: "./public/index.html",
      filename: "index.html",
    }),
    new rspack.CopyRspackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "public"),
          to: ".",
          globOptions: {
            ignore: ["**/index.html"],
          },
        },
      ],
    }),
    new rspack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    }),
    new rspack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(isDev ? "development" : "production"),
    }),
  ],
  devServer: {
    port: 3000,
    hot: true,
    historyApiFallback: true,
    static: {
      directory: path.resolve(__dirname, "public"),
    },
  },
  experiments: {
    css: true,
  },
};
