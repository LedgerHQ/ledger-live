const { resolve } = require("path");
const { withUnimodules } = require("@expo/webpack-config/addons");

module.exports = ({ config }) => {
  config.resolve.extensions = [".ts", ".tsx", ".js", ".json"];

  const babelRule = config.module.rules.find(
    (rule) => rule.exclude.toString() === "/node_modules/",
  );
  if (babelRule) babelRule.exclude = /node_modules\/(?!(@ledgerhq\/ui-shared|victory-native)\/).*/;

  return withUnimodules(config, {
    projectRoot: resolve(__dirname, "../"),
  });
};
