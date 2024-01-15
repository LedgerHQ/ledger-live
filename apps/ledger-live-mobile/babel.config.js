module.exports = {
  presets: [
    "module:metro-react-native-babel-preset",
    [
      "@babel/preset-react",
      {
        runtime: "automatic",
      },
    ],
  ],
  plugins: [
    "@babel/plugin-transform-named-capturing-groups-regex",
    "@babel/plugin-proposal-export-namespace-from",
    "@babel/plugin-transform-class-static-block",
    "react-native-reanimated/plugin", // react-native-reanimated/plugin has to be listed last.
  ],
};
