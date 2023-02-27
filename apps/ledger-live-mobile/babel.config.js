module.exports = {
  presets: [
    [
      "module:metro-react-native-babel-preset",
      { useTransformReactJSXExperimental: true },
    ],
    "@babel/preset-env",
    ["@babel/preset-react", { runtime: "automatic" }],
    "@babel/preset-typescript",
  ],
  plugins: [
    "react-native-reanimated/plugin",
    "@babel/plugin-transform-named-capturing-groups-regex",
    "@babel/plugin-proposal-export-namespace-from",
    ["@babel/plugin-proposal-private-methods", { loose: true }],
    ["@babel/plugin-proposal-class-properties", { loose: true }],
    ["@babel/plugin-proposal-private-property-in-object", { loose: true }],
  ],
};
