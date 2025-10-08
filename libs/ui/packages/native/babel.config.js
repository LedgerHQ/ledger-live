module.exports = {
  presets: ["module:@react-native/babel-preset"],
  plugins: [
    // ["babel-plugin-react-docgen-typescript", { exclude: "node_modules" }],
    "@babel/plugin-transform-export-namespace-from",
    ["@babel/plugin-transform-class-properties", { loose: true }],
    "react-native-reanimated/plugin",
  ],
};
