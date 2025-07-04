const path = require("path");
const { resolve } = path;
const webpack = require("webpack");

module.exports = ({ config }) => {
  config.resolve.symlinks = true;
  config.resolve.alias["react-native$"] = "react-native-web";
  config.resolve.alias["../Utilities/Platform"] = "react-native-web/dist/exports/Platform";
  config.resolve.modules = [path.resolve(__dirname, "..", "node_modules"), "node_modules"];

  // console.log(require("util").inspect(config, { depth: null, colors: true }));
  config.resolve.fallback = {
    ...(config.resolve.fallback || {}),
    os: require.resolve("os-browserify/browser"),
    tty: require.resolve("tty-browserify"),
  };
  return config;
};
