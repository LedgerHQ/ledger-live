module.exports = function override(webpackConfig) {
  const babelRule = webpackConfig.module.rules[2].oneOf[2];
  babelRule.options.plugins = ["@babel/plugin-proposal-class-properties"];
  // console.log(babelRule.options);

  webpackConfig.module.rules.push({
    test: /\.js$/i,
    loader: require.resolve("@open-wc/webpack-import-meta-loader"),
  });

  webpackConfig.module.rules.push({
    test: /\.mjs$/,
    include: /node_modules/,
    type: "javascript/auto",
  });

  return webpackConfig;
};
