const path = require("path");
const fs = require("fs");
const { processNativeModules } = require("@ledgerhq/native-modules-tools");
const lldRoot = path.resolve(__dirname, "..");

exports.default = async function (context) {
  // Rebuild native modules
  await context.packager.info.installAppDependencies(context.packager.platform, context.arch);
  // Remove previous node_modules
  const distNodeModulesPath = path.join(lldRoot, "dist", "node_modules");
  if (fs.existsSync(distNodeModulesPath)) {
    fs.rmSync(distNodeModulesPath, { recursive: true });
  }
  // Find native modules and copy them to ./dist/node_modules with their dependencies.
  await processNativeModules({ root: lldRoot, destination: "dist", silent: true });
};
