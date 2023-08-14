const path = require("path");
const { resolve } = path;
const webpack = require("webpack");

module.exports = ({ config }) => {
  config.resolve.symlinks = true;
  config.resolve.alias["victory-native"] = "victory";
  config.resolve.alias["react-native$"] = "react-native-web";
  config.resolve.alias["../Utilities/Platform"] = "react-native-web/dist/exports/Platform";
  config.resolve.modules = [path.resolve(__dirname, "..", "node_modules"), "node_modules"];

  // This is needed because the storybook reads the public path from the "homepage" package.json field…
  config.output.publicPath = "/";

  // console.log(require("util").inspect(config, { depth: null, colors: true }));

  return config;
};
