module.exports = {
  presets: ["module:metro-react-native-babel-preset"],
  plugins: [
    "@babel/plugin-transform-named-capturing-groups-regex",
    "@babel/plugin-proposal-export-namespace-from",
    "react-native-reanimated/plugin",
  ],
};
