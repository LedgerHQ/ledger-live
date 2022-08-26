const path = require("path");
const fs = require("fs");
const { processNativeModules } = require("native-modules-tools");
const rebuildNativeModules = require("./rebuildNativeModules");

const lldRoot = path.resolve(__dirname, "..");

exports.default = async function(context) {
  const { appDir, electronVersion, arch } = context;
  // Rebuild native modules for the given arch.
  await rebuildNativeModules({
    rootDir: appDir,
    target: electronVersion,
    arch: arch,
  });
  // Remove previous node_modules
  fs.rmSync(path.join(lldRoot, "dist", "node_modules"), { recursive: true });
  // Find native modules and copy them to ./dist/node_modules with their dependencies.
  processNativeModules({ root: lldRoot, destination: "dist", silent: true });
  return false;
};
