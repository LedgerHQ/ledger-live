// Returning false marks node_modules as handled externally (rspack bundles them).
exports.default = async function () {
  return false;
};
