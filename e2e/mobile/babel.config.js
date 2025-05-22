module.exports = {
  plugins: [
    "@babel/plugin-transform-named-capturing-groups-regex",
    "@babel/plugin-proposal-export-namespace-from",
    ["@babel/plugin-proposal-class-properties", { loose: true }],
  ],
};
