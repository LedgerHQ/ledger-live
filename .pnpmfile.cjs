const { assertDependencyChecks } = require("./tools/dependency-checks/validate");

function afterAllResolved(lockfile) {
  assertDependencyChecks(lockfile);
  return lockfile;
}

module.exports = {
  hooks: { afterAllResolved },
};
