/**
 * Loader for animation JSON files.
 * Emits the JSON as an asset and exports require() call for runtime loading.
 * This replicates esbuild's JsonPlugin behavior for reduced bundle size.
 * Works in Electron where nodeIntegration is enabled.
 */
const crypto = require("crypto");
const path = require("path");

module.exports = function animationJsonLoader(source) {
  // Compute content hash for unique filename
  const hash = crypto.createHash("md5").update(source).digest("hex").slice(0, 16);
  const baseName = path.basename(this.resourcePath, ".json");
  const fileName = `assets/${hash}-${baseName}.json`;

  // Emit the JSON file as an asset
  this.emitFile(fileName, source);

  // Return a module that uses __dirname to resolve the asset path
  // __dirname points to the directory of the bundle file (.webpack/)
  // We use __non_webpack_require__ which becomes actual require() at runtime
  // and is not processed by rspack
  return `
var path = __non_webpack_require__("path");
var assetPath = path.join(__dirname, ${JSON.stringify(fileName)});
module.exports = __non_webpack_require__(assetPath);
`;
};

// Get raw buffer
module.exports.raw = true;
