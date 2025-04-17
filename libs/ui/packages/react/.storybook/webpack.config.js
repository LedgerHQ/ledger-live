const path = require("path");

module.exports = ({ config }) => {
  // Alternately, for an alias:
  // config.resolve.alias = {
  //   "@ui": path.resolve(__dirname, "..", "src"),
  //   "@assets": path.resolve(__dirname, "..", "src", "assets"),
  //   "@styles": path.resolve(__dirname, "..", "src", "styles"),
  //   "@components": path.resolve(__dirname, "..", "src", "components"),
  // };

  config.resolve.extensions = [".ts", ".tsx", ".js", ".json", ".mdx"];
  config.resolve.modules = [path.resolve(__dirname, "..", "node_modules"), "node_modules"];
  config.resolve.fallback = {
    os: require.resolve("os-browserify/browser"),
    tty: require.resolve("tty-browserify"),
  };

  return config;
};
