const common = require("./common.esbuild");
const { electronPreloaderExternals } = require("@ledgerhq/esbuild-utils");

module.exports = {
  ...common,
  entryPoints: ["./src/webviewPreloader/dappPreloader.ts"],
  entryNames: "webviewDappPreloader.bundle",
  platform: "node",
  format: "cjs",
  target: ["chrome120"],
  external: [...electronPreloaderExternals],
};
