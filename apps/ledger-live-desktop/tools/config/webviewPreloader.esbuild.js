const common = require("./common.esbuild");
const { electronPreloaderExternals } = require("@ledgerhq/esbuild-utils");

module.exports = {
  ...common,
  entryPoints: ["./src/webviewPreloader/index.ts"],
  entryNames: "webviewPreloader.bundle",
  platform: "node",
  format: "cjs",
  target: ["chrome120"],
  external: [...electronPreloaderExternals],
};
