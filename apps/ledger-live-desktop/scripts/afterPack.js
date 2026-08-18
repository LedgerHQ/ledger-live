/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const { flipFuses, FuseVersion, FuseV1Options } = require("@electron/fuses");

exports.default = function (context) {
  const { appOutDir, electronPlatformName, packager } = context;

  // The MAS target is only valid with the per-channel overrides tools/dist injects;
  // refuse a direct electron-builder run that would ship a misconfigured package.
  if (electronPlatformName === "mas" && process.env.LEDGER_MAS_DIST !== "1") {
    throw new Error(
      "Refusing to build the Mac App Store target directly: the mandatory per-channel " +
        "overrides were not applied. Build it via `pnpm <release|pre|nightly>:lld:mas`.",
    );
  }

  const ext = {
    darwin: ".app",
    mas: ".app",
    win32: ".exe",
  }[electronPlatformName];
  if (!ext) return; // ASAR integrity check is only supported on mac and windows

  const electronBinaryPath = path.join(appOutDir, packager.appInfo.productFilename + ext);

  return flipFuses(electronBinaryPath, {
    version: FuseVersion.V1,
    [FuseV1Options.RunAsNode]: true,
    [FuseV1Options.EnableCookieEncryption]: false,
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: true,
    [FuseV1Options.EnableNodeCliInspectArguments]: true,
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
    [FuseV1Options.OnlyLoadAppFromAsar]: true,
    [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: false,
    [FuseV1Options.GrantFileProtocolExtraPrivileges]: true,
  });
};
