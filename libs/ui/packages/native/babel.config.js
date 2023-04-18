module.exports = {
  presets: ["module:metro-react-native-babel-preset"],
  plugins: [
    // ["babel-plugin-react-docgen-typescript", { exclude: "node_modules" }],
    "@babel/plugin-proposal-export-namespace-from",
    ["@babel/plugin-proposal-class-properties", { loose: true }],
    "react-native-reanimated/plugin",
  ],
};
