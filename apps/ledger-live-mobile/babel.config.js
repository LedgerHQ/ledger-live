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
    "react-native-reanimated/plugin",
    "@babel/plugin-transform-named-capturing-groups-regex",
    "@babel/plugin-proposal-export-namespace-from",
  ],
};
