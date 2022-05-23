const common = require("./common.esbuild");
const { electronPreloaderExternals } = require("esbuild-utils");

module.exports = {
  ...common,
  entryPoints: ["./src/webviewPreloader/index.js"],
  entryNames: "webviewPreloader.bundle",
  platform: "browser",
  format: "iife",
  target: ["chrome91"],
  external: [...electronPreloaderExternals],
};
