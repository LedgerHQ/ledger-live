const { resolve } = require("path");
const { withUnimodules } = require("@expo/webpack-config/addons");

module.exports = ({ config }) => {
  // Alternately, for an alias:
  config.resolve.alias = {
    ...config.resolve.alias,
    "@ui": resolve(__dirname, "..", "src"),
    "@assets": resolve(__dirname, "..", "src", "assets"),
    "@styles": resolve(__dirname, "..", "src", "styles"),
    "@components": resolve(__dirname, "..", "src", "components"),
    "victory-native": "victory"
  };
  config.resolve.extensions = [".ts", ".tsx", ".js", ".json"];

  const babelRule = config.module.rules.find(
    (rule) => rule.exclude.toString() === "/node_modules/"
  );
  if (babelRule)
    babelRule.exclude = /node_modules\/(?!(@ledgerhq\/ui-shared)\/).*/;

  return withUnimodules(config, {
    projectRoot: resolve(__dirname, "../"),
  });
};
