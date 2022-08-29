const path = require("path");
const fs = require("fs");
const { findNativeModules, processNativeModules } = require("native-modules-tools");
const rebuildNativeModules = require("./rebuildNativeModules");

exports.default = async function(context) {
  const { appDir, electronVersion, arch } = context;
  // Rebuild native modules for the given arch.
  const nativeModules = findNativeModules(appDir);
  await rebuildNativeModules({
    nativeModules,
    target: electronVersion,
    arch: arch,
  });
  // Remove previous node_modules
  fs.rmSync(path.join(appDir, "dist", "node_modules"), { recursive: true });
  // Find native modules and copy them to ./dist/node_modules with their dependencies.
  processNativeModules({ nativeModules, destination: "dist", silent: true, throwOnError: true });
  return false;
};
