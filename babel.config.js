module.exports = api => {
  const presets = [];
  if (api.env("test") || api.env("cjs")) {
    presets.push([
      "@babel/preset-env",
      {
        targets: {
          node: "current",
          chrome: 55
        }
      }
    ]);
  }
  presets.push("@babel/preset-flow");
  presets.push("@babel/preset-react");

  const plugins = [
    "@babel/plugin-proposal-export-default-from",
    "@babel/plugin-proposal-export-namespace-from",
    "@babel/plugin-syntax-dynamic-import",
    "@babel/plugin-syntax-import-meta",
    ["@babel/plugin-proposal-class-properties", { loose: true }]
  ];

  return {
    presets,
    plugins
  };
};
