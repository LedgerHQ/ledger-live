const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const UnusedWebpackPlugin = require("unused-webpack-plugin");
const Dotenv = require("dotenv-webpack");

const lldFolder = path.resolve(__dirname, "..", "..");

function getDotenvPathFromEnv() {
  if (process.env.TESTING) {
    return ".env.testing";
  } else if (process.env.STAGING) {
    return ".env.staging";
  } else if (process.env.NODE_ENV === "production") {
    return ".env.production";
  }

  return ".env";
}

module.exports = {
  target: "electron-renderer",
  entry: [path.resolve(lldFolder, "src/renderer/index.js")],
  output: {
    path: path.resolve(lldFolder, ".webpack"),
    filename: "renderer.bundle.js",
  },
  optimization: {
    minimize: false,
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
  },
  plugins: [
    new Dotenv({
      path: getDotenvPathFromEnv(),
      ignoreStub: true,
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(lldFolder, "src/renderer/index.html"),
      filename: "index.html",
      title: "Ledger Live",
    }),
    new UnusedWebpackPlugin({
      directories: [path.join(lldFolder, "src", "renderer")],
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
        loader: "esbuild-loader",
        options: {
          loader: "tsx",
        },
      },
      {
        test: /\.(js)x?$/i,
        use: [
          {
            loader: "esbuild-loader",
            options: {
              loader: "jsx",
              target: "chrome91",
            },
          },
          { loader: "remove-flow-types-loader" },
        ],
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
            esModule: false,
          },
        },
      },
    ],
  },
  resolve: {
    modules: ["node_modules", path.resolve(lldFolder, "node_modules")],
    alias: {
      "~": path.resolve(lldFolder, "src"),
      // See: https://github.com/facebook/react/issues/20235
      "react/jsx-runtime": require.resolve("react/jsx-runtime.js"),
      // Prevents having duplicate react and react-redux contexts when bundling the app in "npm mode".
      // "redux": [require.resolve("redux"), path.dirname(require.resolve("redux"))],
      // "react-redux": [require.resolve("react-redux"), path.dirname(require.resolve("react-redux"))],
      // Alias react-ui and icons-ui peer dependencies to prevent duplicate packages issues.
      react: [require.resolve("react"), path.dirname(require.resolve("react"))],
      "react-dom": [require.resolve("react-dom"), path.dirname(require.resolve("react-dom"))],
      "styled-system": [
        require.resolve("styled-system"),
        path.dirname(require.resolve("styled-system")),
      ],
      "styled-components": [
        require.resolve("styled-components"),
        path.dirname(require.resolve("styled-components")),
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
