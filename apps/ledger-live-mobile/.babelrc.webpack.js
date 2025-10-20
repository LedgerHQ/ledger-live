module.exports = {
  presets: [
    // TypeScript preset MUST come before React Native preset
    ["@babel/preset-typescript", {
      // Only strip types, don't transform other TS features
      onlyRemoveTypeImports: true,
      // Allow decorators (used by some RN packages)
      allowDeclareFields: true,
      // Don't treat all files as TSX - let file extension determine
      // This prevents .ts files with type assertions from being parsed as JSX
      isTSX: false,
      allExtensions: false,
    }],
    [
      "@react-native/babel-preset",
      {
        // Disable automatic JSX runtime to avoid conflicts
        useTransformReactJSXExperimental: false,
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
    // Reanimated plugin disabled for now - was causing bundle issues
    // "react-native-reanimated/plugin",
  ],
};
