const common = require("./common.esbuild");
const { electronPreloaderExternals } = require("esbuild-utils");

module.exports = {
  ...common,
  entryPoints: ["./src/webviewPreloader/index.ts"],
  entryNames: "webviewPreloader.bundle",
  platform: "node",
  format: "cjs",
  target: ["chrome114"],
  external: [...electronPreloaderExternals],
};
