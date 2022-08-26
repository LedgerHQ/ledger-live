const fs = require("fs");
const child_process = require("child_process");
const rebuildNativeModules = require("./rebuildNativeModules");

(async function main() {
  await rebuildNativeModules();

  // when running inside the test electron container, there is no src.
  if (fs.existsSync("src")) {
    child_process.exec("zx ./scripts/sync-families-dispatch.mjs");
  }
})();
