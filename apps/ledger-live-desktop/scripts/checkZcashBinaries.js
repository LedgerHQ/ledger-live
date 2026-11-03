const fs = require("fs");
const path = require("path");

// zcash-utils binaries each platform's package must ship. The universal mac app needs both archs
// (install with `--cpu=arm64 --cpu=x64`).
const EXPECTED = {
  darwin: ["darwin-arm64", "darwin-x64"],
  mas: ["darwin-arm64", "darwin-x64"],
  linux: ["linux-x64-gnu"],
  win32: ["win32-x64-msvc"],
};

// electron-builder silently skips a missing `files` source: fail instead of shipping an app
// that cannot load zcash-utils.
exports.default = function checkZcashBinaries(context) {
  const { appOutDir, electronPlatformName, packager } = context;
  const targets = EXPECTED[electronPlatformName];
  if (!targets) return;

  const resources =
    electronPlatformName === "darwin" || electronPlatformName === "mas"
      ? path.join(appOutDir, `${packager.appInfo.productFilename}.app`, "Contents/Resources")
      : path.join(appOutDir, "resources");
  const nodeModules = path.join(resources, "app.asar.unpacked/node_modules/@ledgerhq");
  const missing = targets
    .map(target => path.join(nodeModules, `zcash-utils-${target}`, `index.${target}.node`))
    .filter(file => !fs.existsSync(file));
  if (missing.length > 0) {
    throw new Error(
      `zcash-utils binaries missing from the packaged app:\n${missing.join("\n")}\n` +
        "Install the platform's zcash-utils package (the mac app needs `pnpm i --cpu=arm64 --cpu=x64`).",
    );
  }
};
