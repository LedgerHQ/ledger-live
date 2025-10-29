module.exports = {
  presets: ["module:@react-native/babel-preset", ["@babel/preset-react", { runtime: "automatic" }]],
  plugins: [
    "@babel/plugin-transform-named-capturing-groups-regex",
    "@babel/plugin-transform-export-namespace-from",
    "@babel/plugin-transform-class-static-block",
    "@babel/plugin-transform-flow-strip-types",
    ["@babel/plugin-transform-class-properties", { loose: true }],
    ["@babel/plugin-transform-private-methods", { loose: true }],
    ["@babel/plugin-transform-private-property-in-object", { loose: true }],
    "@babel/plugin-transform-async-generator-functions",
    "babel-plugin-transform-inline-environment-variables",
    "react-native-reanimated/plugin",
  ],
};
