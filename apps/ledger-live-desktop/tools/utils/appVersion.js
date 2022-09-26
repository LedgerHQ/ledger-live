const { promises: fs } = require("fs");
const path = require("path");
const semver = require("semver");

const getAppVersion = async () => {
  const pkgPath = path.resolve(__dirname, "..", "..", "package.json");
  const pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"));
  return semver.parse(pkg.version);
};

module.exports = {
  getAppVersion,
};
