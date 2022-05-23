const common = require("./common.esbuild");
const { electronPreloaderExternals } = require("esbuild-utils");

module.exports = {
  ...common,
  entryPoints: ["./src/preloader/index.js"],
  entryNames: "preloader.bundle",
  platform: "browser",
  format: "iife",
  target: ["chrome91"],
  external: [...electronPreloaderExternals],
};
