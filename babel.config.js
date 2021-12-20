module.exports = {
  presets: ["module:metro-react-native-babel-preset"],
  plugins: [
    [
      "module-resolver",
      {
        root: ["./src"],
        extensions: [
          ".ios.js",
          ".android.js",
          ".js",
          ".json",
          ".ts",
          ".tsx",
          ".ios.tsx",
          ".android.tsx",
        ],
      },
    ],
    "react-native-reanimated/plugin",
  ],
};
