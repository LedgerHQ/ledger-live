/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");

// electron-builder only writes app-update.yml (what electron-updater reads to
// find the update feed) when the targets include dmg/zip on mac or an
// installer on Windows. `tools/dist pack` packs with --dir, and `sign
// --prepackaged` never runs that step, so pack writes it here instead with
// electron-builder's own functions (channel, macros and all).
const fromElectronBuilder = (pkg, file) => {
  const electronBuilderDir = path.dirname(require.resolve("electron-builder/package.json"));
  const pkgDir = path.dirname(
    require.resolve(`${pkg}/package.json`, { paths: [electronBuilderDir] }),
  );
  return require(path.join(pkgDir, file));
};

exports.default = async function writeAppUpdateConfig(context) {
  if (process.env.LEDGER_PACK_APP_UPDATE_YML !== "1") return;

  const { appOutDir, arch, electronPlatformName, packager } = context;
  if (electronPlatformName !== "darwin" && electronPlatformName !== "win32") return;

  const { getAppUpdatePublishConfiguration } = fromElectronBuilder(
    "app-builder-lib",
    "out/publish/PublishManager.js",
  );
  const { serializeToYaml } = fromElectronBuilder("builder-util", "out/util.js");

  const config = await getAppUpdatePublishConfiguration(packager, null, arch, false);
  if (config == null) {
    throw new Error("No publish config to derive app-update.yml from.");
  }
  fs.writeFileSync(
    path.join(packager.getResourcesDir(appOutDir), "app-update.yml"),
    serializeToYaml(config),
  );
};
