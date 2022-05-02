const path = require("path");
const { withUnimodules } = require("@expo/webpack-config/addons");
const { resolve } = path;

module.exports = ({ config }) => {
  config.resolve.extensions = [".ts", ".tsx", ".js", ".json"];

  const babelRule = config.module.rules.find(
    (rule) => rule.exclude.toString() === "/node_modules/",
  );

  // Some dependencies need to be explicitely transpiled.
  if (babelRule)
    babelRule.exclude = /node_modules[\\\/](?!(@ledgerhq\/ui-shared|victory-native)[\\\/]).*/;

  config = withUnimodules(config, {
    projectRoot: resolve(__dirname, "../"),
  });

  config.resolve.symlinks = true;
  config.resolve.alias["victory-native"] = "victory";
  config.resolve.modules = [path.resolve(__dirname, "..", "node_modules"), "node_modules"];

  return config;
};
