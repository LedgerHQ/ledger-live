module.exports = function override(webpackConfig) {
  const babelRule = webpackConfig.module.rules[2].oneOf[2];
  babelRule.options.plugins = [
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-transform-private-methods",
    "@babel/plugin-transform-logical-assignment-operators",
    "@babel/plugin-transform-nullish-coalescing-operator",
  ];
  console.log(babelRule.options);

  webpackConfig.module.rules.push({
    test: /\.js$/i,
    loader: require.resolve("@open-wc/webpack-import-meta-loader"),
  });

  webpackConfig.module.rules.push({
    test: /\.mjs$/,
    include: /node_modules/,
    type: "javascript/auto",
  });

  // Disable terser because it uses too much memory and makes our vercel deployment crash…
  // TODO: use a better minimizer
  webpackConfig.optimization.minimizer.shift();

  // Webpack 4 is not compatible with package exports…
  // Hence this hack to resolve to browser.js instead of browser.cjs.
  webpackConfig.resolve.alias["@polkadot/x-textencoder$"] = "@polkadot/x-textencoder/browser.js";
  webpackConfig.resolve.alias["@polkadot/x-textdecoder$"] = "@polkadot/x-textdecoder/browser.js";
  webpackConfig.resolve.alias["@ledgerhq/devices"] = "@ledgerhq/devices/lib-es";
  webpackConfig.resolve.alias["@ledgerhq/cryptoassets"] = "@ledgerhq/cryptoassets/lib-es";

  webpackConfig.resolve.alias["@ledgerhq/coin-framework"] = "@ledgerhq/coin-framework/lib-es";
  webpackConfig.resolve.alias["@ledgerhq/coin-polkadot"] = "@ledgerhq/coin-polkadot/lib-es";
  webpackConfig.resolve.alias["@ledgerhq/coin-algorand"] = "@ledgerhq/coin-algorand/lib-es";
  webpackConfig.resolve.alias["@ledgerhq/coin-evm"] = "@ledgerhq/coin-evm/lib-es";
  webpackConfig.resolve.alias["@ledgerhq/evm-tools"] = "@ledgerhq/evm-tools/lib-es";
  webpackConfig.resolve.alias["@ledgerhq/domain-service"] = "@ledgerhq/domain-service/lib-es";
  webpackConfig.resolve.alias["@ledgerhq/live-network"] = "@ledgerhq/live-network/lib-es";
  webpackConfig.resolve.alias["@dfinity/agent"] = "@dfinity/agent/lib/cjs";
  webpackConfig.resolve.alias["@dfinity/candid"] = "@dfinity/candid/lib/cjs";

  webpackConfig.resolve.alias["@zondax/izari-filecoin"] = "@zondax/izari-filecoin/dist/cjs";

  return webpackConfig;
};
