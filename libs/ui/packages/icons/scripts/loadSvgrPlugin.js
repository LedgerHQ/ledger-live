function loadSvgrPlugin(name) {
  const mod = require(name);
  return typeof mod === "function" ? mod : mod.default;
}

module.exports = { loadSvgrPlugin };
