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
    "@babel/plugin-transform-class-static-block",
    "@babel/plugin-transform-flow-strip-types",
    ["@babel/plugin-transform-private-methods", { loose: true }],
    "babel-plugin-transform-inline-environment-variables",
    "react-native-reanimated/plugin", // react-native-reanimated/plugin has to be listed last.
  ],
  overrides: [
    {
      test: filename => {
        if (!filename) return false;
        return /[\\/]react-native-svg[\\/]/.test(filename);
      },
      plugins: ["@react-native/babel-plugin-codegen"],
    },
    {
      test: filename => {
        if (!filename) return false;
        return /[\\/]react-native-safe-area-context[\\/]/.test(filename);
      },
      plugins: ["@react-native/babel-plugin-codegen"],
    },
  ],
};
