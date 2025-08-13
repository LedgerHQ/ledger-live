module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: { node: "current" },
        modules: "commonjs",
      },
    ],
  ],
  plugins: [
    "@babel/plugin-transform-named-capturing-groups-regex",
    "@babel/plugin-transform-export-namespace-from",
    "@babel/plugin-transform-class-static-block",
    ["@babel/plugin-proposal-class-properties", { loose: true }],
  ],
};
