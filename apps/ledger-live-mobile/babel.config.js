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
    "metro-transform-plugins/private/inline-requires-plugin",
    "@babel/plugin-transform-named-capturing-groups-regex",
    "@babel/plugin-transform-export-namespace-from",
    "@babel/plugin-transform-class-static-block",
    "@babel/plugin-transform-flow-strip-types",
    ["@babel/plugin-transform-private-methods", { loose: true }],
    "babel-plugin-transform-inline-environment-variables",
    // only inject collapsable={false} for builds running Detox tests
    process.env.DETOX === "1" || process.env.DETOX === "true"
      ? "./babel-plugin-inject-collapsable.js"
      : null,
    // react-native-worklets/plugin has to be listed last
    "react-native-worklets/plugin",
  ].filter(Boolean),
};
