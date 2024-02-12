const common = require("./common.esbuild");
const { electronPreloaderExternals } = require("@ledgerhq/esbuild-utils");

module.exports = {
  ...common,
  entryPoints: ["./src/preloader/index.ts"],
  entryNames: "preloader.bundle",
  platform: "node",
  format: "cjs",
  target: ["chrome120"],
  external: [...electronPreloaderExternals],
};
