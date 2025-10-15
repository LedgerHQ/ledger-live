/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const { flipFuses, FuseVersion, FuseV1Options } = require("@electron/fuses");

exports.default = function (context) {
  const { appOutDir, electronPlatformName, packager } = context;
  const ext = {
    darwin: ".app",
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
