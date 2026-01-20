const path = require("node:path");
const { defineConfig } = require("@rsbuild/core");
const { pluginReact } = require("@rsbuild/plugin-react");

module.exports = defineConfig({
  plugins: [pluginReact()],
  source: {
    define: {
      __DEV__: JSON.stringify(true),
    },
  },
  resolve: {
    alias: {
      "expo-font": path.resolve(__dirname, ".storybook-web/expoFontStub.js"),
      "@storybook/jest": path.resolve(__dirname, ".storybook-web/jestStub.js"),
      "@storybook/addon-actions": path.resolve(__dirname, ".storybook-web/addonActionsStub.js"),
      "expo-asset": require.resolve("expo-asset"),
      react: require.resolve("react"),
      "react-dom": require.resolve("react-dom"),
      "react-native": require.resolve("react-native-web"),
      "react-native$": "react-native-web",
      "../Utilities/Platform": "react-native-web/dist/exports/Platform",
    },
    extensions: [
      ".web.tsx",
      ".web.ts",
      ".web.jsx",
      ".web.js",
      ".tsx",
      ".ts",
      ".jsx",
      ".js",
      ".json",
    ],
    fallback: {
      os: require.resolve("os-browserify/browser"),
      tty: require.resolve("tty-browserify"),
    },
  },
  tools: {
    rspack: (config) => {
      config.module = config.module || { rules: [] };
      config.module.rules = config.module.rules || [];
      config.module.rules.unshift({
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: "builtin:swc-loader",
        options: {
          jsc: {
            parser: {
              syntax: "ecmascript",
              jsx: true,
            },
          },
        },
        type: "javascript/auto",
      });
      config.module.rules.push(
        // Process source files with worklets babel plugin
        {
          test: /\.[jt]sx?$/,
          include: path.resolve(__dirname, "src"),
          loader: "babel-loader",
          options: {
            presets: [
              require.resolve("@react-native/babel-preset"),
              [require.resolve("@babel/preset-typescript"), { isTSX: true, allExtensions: true }],
            ],
            plugins: [
              require.resolve("@babel/plugin-transform-export-namespace-from"),
              require.resolve("react-native-worklets/plugin"),
            ],
            babelrc: false,
            configFile: false,
          },
        },
        // Process node_modules that need worklet transformation
        {
          test: /\.[cm]?jsx?$/,
          include:
            /node_modules[\\/](react-native|react-native-reanimated|react-native-worklets|react-native-svg|@react-native|@react-native-community|expo)/,
          loader: "babel-loader",
          options: {
            presets: [require.resolve("@react-native/babel-preset")],
            plugins: [require.resolve("react-native-worklets/plugin")],
            babelrc: false,
            configFile: false,
          },
        },
        {
          test: /\.(otf|ttf)$/,
          type: "asset/resource",
          generator: {
            filename: "assets/fonts/[name][ext]",
          },
        },
      );
      config.resolve = config.resolve || {};
      config.resolve.symlinks = true;
      config.resolve.modules = [
        path.resolve(__dirname, "node_modules"),
        path.resolve(__dirname, "../../../node_modules"),
        "node_modules",
      ];
    },
  },
});
