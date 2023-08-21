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
    "react-native-reanimated/plugin",
  ],
};
