const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const babelPlugins = require("./babel.plugins");
const UnusedWebpackPlugin = require("unused-webpack-plugin");

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
  target: "electron-renderer",
  entry: ["./src/renderer/index.js"],
  output: {
    path: path.resolve(__dirname, ".webpack"),
    filename: "renderer.bundle.js",
  },
  optimization: {
    minimize: false,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/renderer/index.html",
      filename: "index.html",
      title: "Ledger Live",
    }),
    new UnusedWebpackPlugin({
      directories: [path.join(__dirname, "src/renderer")],
      exclude: [
        "*.test.js",
        "*.html",
        "bridge/proxy-commands.js",
        "fonts/inter/Inter-Bold.woff2",
        "types.js",
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(ts)x?$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        options: babelTsConfig,
      },
      {
        test: /\.js$/i,
        loader: "babel-loader",
        exclude: /node_modules/,
        options: babelConfig,
      },
      {
        test: /\.js$/i,
        loader: require.resolve('@open-wc/webpack-import-meta-loader'),
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      process.env.V3
        ? {
          test: /\.woff2/,
          use: [
            {
              loader: "file-loader",
              options: {
                name: "[name].[ext]",
                outputPath: "assets/fonts/",
              },
            },
          ],
        }
        : {
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
    alias: {
      "~": path.resolve(__dirname, "src"),
      // See: https://github.com/facebook/react/issues/20235
      "react/jsx-runtime": require.resolve("react/jsx-runtime.js"),
      // Alias react-ui and icons-ui peer dependencies to prevent duplicate packages issues.
      "react": [
        require.resolve("react"),
        path.dirname(require.resolve("react"))
      ],
      "react-dom": [
        require.resolve("react-dom"),
        path.dirname(require.resolve("react-dom"))
      ],
      "styled-system": [
        require.resolve("styled-system"),
        path.dirname(require.resolve("styled-system"))
      ],
      "styled-components": [
        require.resolve("styled-components"),
        path.dirname(require.resolve("styled-components"))
      ],
    },
    ...(process.env.V3
      ? {
        extensions: [
          ".v3.tsx",
          ".v3.ts",
          ".v3.jsx",
          ".v3.js",
          ".tsx",
          ".ts",
          ".jsx",
          ".js",
          "...",
        ],
      }
      : {
        extensions: [
          ".jsx",
          ".js",
          ".v3.tsx",
          ".v3.ts",
          ".v3.jsx",
          ".v3.js",
          ".tsx",
          ".ts",
          "...",
        ],
      }),
  },
};
