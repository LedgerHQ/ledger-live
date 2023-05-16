const common = require("./common.esbuild");
const { electronPreloaderExternals } = require("esbuild-utils");

module.exports = {
  ...common,
  entryPoints: ["./src/swapConnectWebviewPreloader/index.ts"],
  entryNames: "swapConnectWebviewPreloader.bundle",
  platform: "node",
  format: "cjs",
  target: ["chrome91"],
  external: [...electronPreloaderExternals],
};
