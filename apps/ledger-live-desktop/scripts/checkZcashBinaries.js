const fs = require("fs");
const path = require("path");
const { Arch } = require("electron-builder");

// zcash-utils package each target needs. A universal mac build runs afterPack on its x64 slice,
// its arm64 slice and the merged app: the merged app needs both (install with `--cpu=arm64 --cpu=x64`).
const MAC = {
  [Arch.x64]: ["darwin-x64"],
  [Arch.arm64]: ["darwin-arm64"],
  [Arch.universal]: ["darwin-arm64", "darwin-x64"],
};
const EXPECTED = {
  darwin: MAC,
  mas: MAC,
  linux: { [Arch.x64]: ["linux-x64-gnu"] },
  win32: { [Arch.x64]: ["win32-x64-msvc"] },
};

// electron-builder silently skips a missing `files` source: fail instead of shipping an app
// that cannot load zcash-utils.
exports.default = function checkZcashBinaries(context) {
  const { appOutDir, arch, electronPlatformName, packager } = context;
  const platform = EXPECTED[electronPlatformName];
  if (!platform) return;
  const targets = platform[arch];
  if (!targets) {
    throw new Error(`zcash-utils has no package for ${electronPlatformName} ${Arch[arch]}.`);
  }

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
        "Install the platform's zcash-utils package (the universal mac app needs `pnpm i --cpu=arm64 --cpu=x64`).",
    );
  }
};
