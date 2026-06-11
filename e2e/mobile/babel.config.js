module.exports = {
  plugins: [
    "@babel/plugin-transform-named-capturing-groups-regex",
    "@babel/plugin-transform-export-namespace-from",
    ["@babel/plugin-proposal-class-properties", { loose: true }],
    // Convert ESM-only live-common (`lib-es`) to CommonJS in jest workers. See LIVE-31760.
    "@babel/plugin-transform-modules-commonjs",
    "@babel/plugin-transform-dynamic-import",
  ],
};
