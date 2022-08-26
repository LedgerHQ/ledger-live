const path = require("path");
const { command: execaCommand } = require("execa");
const { findNativeModules, findPackageRoot } = require("native-modules-tools");

const root = path.resolve(__dirname, "..");
const electronPkg = require("electron/package.json");
const electronVersion = electronPkg.version;
const homeDir = require("os").homedir();

function bold(str) {
  return "\u001b[1m" + str + "\u001b[0;0m";
}

module.exports = async function({
  rootDir = root,
  target = electronVersion,
  platform = process.platform,
  arch = process.arch,
  home = homeDir,
  buildFromSources = false,
} = {}) {
  const nativeModules = findNativeModules(rootDir);
  for (const modulePath of nativeModules) {
    const moduleName = modulePath.split("/").slice(-1);
    console.log(bold(`[Native Rebuild] ${moduleName} (${target}/${arch}) @ ${modulePath}`));
    try {
      let prebuildInstallDir;
      try {
        prebuildInstallDir = findPackageRoot(
          require.resolve("prebuild-install", { paths: [modulePath] }),
        );
      } catch (_) {
        prebuildInstallDir = null;
      }
      // console.log("prebuildInstallDir: ", prebuildInstallDir);
      const pkg = require(modulePath + "/package.json");
      const execOptions = {
        cwd: modulePath,
        stdio: "inherit",
      };
      const envPrefix = `env HOME=${homeDir}/.electron-gyp npm_config_target=${target} npm_config_platform=${platform} npm_config_arch=${arch} npm_config_target_arch=${arch} npm_config_disturl=https://electronjs.org/headers npm_config_runtime=napi npm_config_build_from_source=${buildFromSources}`;
      const prebuildFlags = `--arch=${arch} --platform=${platform} ${
        buildFromSources ? "--build-from-source" : ""
      } --verbose --force`;

      let installDone;

      if (prebuildInstallDir) {
        const napiVersions = pkg?.binary?.napi_versions;
        try {
          if (napiVersions) {
            const napiVersion = (napiVersions || [3])[napiVersions.length - 1];
            await execaCommand(
              `node ${prebuildInstallDir}/bin.js -r napi -t ${napiVersion} ${prebuildFlags}`,
              execOptions,
            );
          } else {
            await execaCommand(
              `node ${prebuildInstallDir}/bin.js -r electron -t ${electronVersion} ${prebuildFlags}`,
              execOptions,
            );
          }
          installDone = true;
        } catch (_) {
          installDone = false;
        }
      }

      if (!installDone) {
        if (pkg?.scripts?.install) {
          await execaCommand(`${envPrefix} npm run install --loglevel=error`, execOptions);
        } else {
          await execaCommand(`${envPrefix} node-gyp rebuild --loglevel=error`, execOptions);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
};
