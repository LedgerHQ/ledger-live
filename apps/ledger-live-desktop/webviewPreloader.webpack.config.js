const path = require("path");
const babelPlugins = require("./babel.plugins");

const babelConfig = {
  presets: [
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
  target: "electron-renderer",
  entry: ["./src/webviewPreloader/index.js"],
  output: {
    path: path.resolve(__dirname, ".webpack"),
    filename: "webviewPreloader.bundle.js",
  },
  plugins: [],
  module: {
    rules: [
      {
        test: /\.js$/i,
        loader: "babel-loader",
        exclude: /node_modules/,
        options: babelConfig,
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        use: ["file-loader"],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        use: {
          loader: "url-loader",
          options: {
            limit: 8192,
            fallback: require.resolve("file-loader"),
          },
        },
      },
      {
        type: "javascript/auto",
        test: /\.mjs$/,
        use: [],
      },
    ],
  },
  resolve: {
    modules: ["node_modules", path.resolve(__dirname, "node_modules")],
    alias: {
      "~": path.resolve(__dirname, "src"),
    },
  },
};
