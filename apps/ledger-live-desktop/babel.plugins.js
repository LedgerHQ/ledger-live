const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === "development";

module.exports = [
  ...(isDevelopment ? [require.resolve("react-refresh/babel")] : []),
  "@babel/plugin-proposal-export-default-from",
  "@babel/plugin-proposal-export-namespace-from",
  "@babel/plugin-syntax-dynamic-import",
  "@babel/plugin-syntax-import-meta",
  ["@babel/plugin-proposal-class-properties", { loose: true }],
  ["@babel/plugin-proposal-private-methods", { loose: true }],
  ["@babel/plugin-proposal-private-property-in-object", { loose: true }],
];
