const fs = require("fs");
const path = require("path");

// electron-builder silently skips a missing `files` source: fail instead of shipping a mac app
// whose other arch cannot load zcash-utils (install with `--cpu=arm64 --cpu=x64`).
exports.default = function checkZcashBinaries(context) {
  const { appOutDir, electronPlatformName, packager } = context;
  if (electronPlatformName !== "darwin" && electronPlatformName !== "mas") return;

  const nodeModules = path.join(
    appOutDir,
    `${packager.appInfo.productFilename}.app`,
    "Contents/Resources/app.asar.unpacked/node_modules/@ledgerhq",
  );
  const missing = ["arm64", "x64"]
    .map(arch => path.join(nodeModules, `zcash-utils-darwin-${arch}`, `index.darwin-${arch}.node`))
    .filter(file => !fs.existsSync(file));
  if (missing.length > 0) {
    throw new Error(
      `zcash-utils binaries missing from the packaged app:\n${missing.join("\n")}\n` +
        "Install the desktop dependencies with `pnpm i --cpu=arm64 --cpu=x64`.",
    );
  }
};
