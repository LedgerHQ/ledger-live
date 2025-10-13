module.exports = {
  presets: [
    "module:@react-native/babel-preset",
    [
      "@babel/preset-react",
      {
        runtime: "automatic",
      },
    ],
  ],
  plugins: [
    "@babel/plugin-transform-named-capturing-groups-regex",
    "@babel/plugin-transform-export-namespace-from",
    "babel-plugin-syntax-hermes-parser",
    "@react-native/babel-plugin-codegen",
    "@babel/plugin-transform-class-static-block",
    "@babel/plugin-transform-flow-strip-types",
    ["@babel/plugin-transform-private-methods", { loose: true }],
    "babel-plugin-transform-inline-environment-variables",
    "react-native-reanimated/plugin", // react-native-reanimated/plugin has to be listed last.
  ],
};
