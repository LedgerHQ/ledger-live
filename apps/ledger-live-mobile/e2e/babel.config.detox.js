module.exports = {
  presets: ["module:@react-native/babel-preset"],
  plugins: [
    "@babel/plugin-transform-named-capturing-groups-regex",
    "@babel/plugin-transform-export-namespace-from",
    ["@babel/plugin-transform-class-properties", { loose: true }],
    [
      "babel-plugin-styled-components",
      {
        ssr: false,
        displayName: true,
        fileName: true,
        minify: true,
        transpileTemplateLiterals: true,
        pure: true,
      },
    ],
    "react-native-reanimated/plugin",
  ],
};
