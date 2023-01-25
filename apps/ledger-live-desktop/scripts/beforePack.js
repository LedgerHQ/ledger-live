const path = require("path");
const fs = require("fs");
const { flipFuses, FuseVersion, FuseV1Options } = require("@electron/fuses");
const { processNativeModules } = require("native-modules-tools");
const lldRoot = path.resolve(__dirname, "..");

exports.default = async function(context) {
  console.log(context);
  // Rebuild native modules
  await context.packager.info.installAppDependencies(context.packager.platform, context.arch);
  // Remove previous node_modules
  fs.rmSync(path.join(lldRoot, "dist", "node_modules"), { recursive: true });
  // Find native modules and copy them to ./dist/node_modules with their dependencies.
  processNativeModules({ root: lldRoot, destination: "dist", silent: true });

  await flipFuses(require("electron"), {
    version: FuseVersion.V1,
    [FuseV1Options.RunAsNode]: false,
    resetAdHocDarwinSignature: context.packager.platform === "darwin" && context.arch === "arm64",
  });
};
