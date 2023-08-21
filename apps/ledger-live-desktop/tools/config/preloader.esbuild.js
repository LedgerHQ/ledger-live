const common = require("./common.esbuild");
const { electronPreloaderExternals } = require("esbuild-utils");

module.exports = {
  ...common,
  entryPoints: ["./src/preloader/index.ts"],
  entryNames: "preloader.bundle",
  platform: "node",
  format: "cjs",
  target: ["chrome91"],
  external: [...electronPreloaderExternals],
};
