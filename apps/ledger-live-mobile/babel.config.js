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
    [
      "metro-transform-plugins/private/inline-requires-plugin",
      {
        ignoredRequires: ["react-native"],
      },
    ],
    "@babel/plugin-transform-named-capturing-groups-regex",
    "@babel/plugin-transform-export-namespace-from",
    "@babel/plugin-transform-class-static-block",
    "@babel/plugin-transform-flow-strip-types",
    ["@babel/plugin-transform-private-methods", { loose: true }],
    // Transform template literals for Hermes compatibility (ajv uses tagged templates)
    "@babel/plugin-transform-template-literals",
    [
      "babel-plugin-transform-inline-environment-variables",
      // Exclude JEST_WORKER_ID and VITEST_WORKER_ID to avoid MMKV conflicts
      // MMKV checks for these variables to determine if it runs for tests.
      { exclude: ["JEST_WORKER_ID", "VITEST_WORKER_ID"] },
    ],
    // Fabric optimization are not supported by Detox and needs to be disabled.
    // Only inject collapsable={false} for builds running Detox tests.
    process.env.DETOX === "1" || process.env.DETOX === "true"
      ? "./babel-plugin-inject-collapsable.js"
      : null,
    // react-native-worklets/plugin has to be listed last
    "react-native-worklets/plugin",
  ].filter(Boolean),
};
