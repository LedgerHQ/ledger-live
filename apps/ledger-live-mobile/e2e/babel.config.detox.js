module.exports = {
  presets: ["module:metro-react-native-babel-preset"],
  plugins: [
    "@babel/plugin-transform-named-capturing-groups-regex",
    "@babel/plugin-transform-export-namespace-from",
    ["@babel/plugin-transform-class-properties", { loose: true }],
    "react-native-reanimated/plugin",
  ],
};
