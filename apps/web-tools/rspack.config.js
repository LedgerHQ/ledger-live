const path = require("path");
const rspack = require("@rspack/core");
const ReactRefreshPlugin = require("@rspack/plugin-react-refresh");

const isDev = process.env.NODE_ENV !== "production";

const pages = {
  index: "./src/entries/index.tsx",
  "crypto-icons": "./src/entries/crypto-icons.tsx",
  derivations: "./src/entries/derivations.tsx",
  "domain-tlv-parser": "./src/entries/domain-tlv-parser.tsx",
  "eth-tx-tools": "./src/entries/eth-tx-tools.tsx",
  "lld-signatures": "./src/entries/lld-signatures.tsx",
  logsviewer: "./src/entries/logsviewer.tsx",
  networkTroubleshoot: "./src/entries/networkTroubleshoot.tsx",
  repl: "./src/entries/repl.tsx",
  sync: "./src/entries/sync.tsx",
  trustchain: "./src/entries/trustchain.tsx",
};

/** @type {import('@rspack/core').Configuration} */
module.exports = {
  mode: isDev ? "development" : "production",
  entry: pages,
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "static/js/[name].[contenthash:8].js",
    publicPath: "/",
    clean: true,
  },
  devtool: isDev ? "eval-source-map" : "source-map",
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
    fallback: {
      assert: false,
      buffer: false,
      crypto: false,
      dns: false,
      events: false,
      fs: false,
      http: false,
      https: false,
      net: false,
      path: false,
      querystring: false,
      string_decoder: false,
      stream: false,
      tls: false,
      url: false,
      util: false,
      zlib: false,
    },
  },
  module: {
    rules: [
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
                refresh: isDev,
              },
            },
          },
        },
        type: "javascript/auto",
      },
      {
        test: /\.(js|jsx)$/,
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
                development: isDev,
                refresh: isDev,
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
    ...Object.keys(pages).map(
      name =>
        new rspack.HtmlRspackPlugin({
          template: "./public/index.html",
          filename: `${name}.html`,
          chunks: [name],
        }),
    ),
    new rspack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(isDev ? "development" : "production"),
    }),
    isDev && new ReactRefreshPlugin(),
    new rspack.IgnorePlugin({
      resourceRegExp: /^electron$/,
    }),
  ].filter(Boolean),
  devServer: {
    port: 3000,
    hot: true,
    compress: true,
    historyApiFallback: false,
  },
  experiments: {
    asyncWebAssembly: true,
    css: true,
  },
};
