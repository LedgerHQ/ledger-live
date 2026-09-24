/**
 * This file exists for the sole purpose of hijacking the packages installation process.
 *
 * It contains a lot of monkey patches because some packages we use have issues when declaring
 * their own dependencies. It causes problems with pnpm which enforces a strict package resolution.
 *
 * Ideally package maintainers would update their packages and we would not need this file anymore.
 * But this is world is cruel… Feel free to reach out and make PRs if you are motivated enough.
 *
 * See: https://pnpm.io/pnpmfile
 */

const {
  process,
  addDependencies,
  addDevDependencies,
  addPeerDependencies,
  removeDependencies,
} = require("./tools/pnpm-utils");
const { assertDependencyChecks } = require("./tools/dependency-checks/validate");

function readPackage(pkg, context) {
  process(
    [
      /*
        The following packages are broken and do not declare their dependencies properly.
        So we are going to patch these until the maintainers fix their own stuff…
        Feel free to make PRs if you feel like it :).
      */
      addDependencies("jest-allure2-reporter", { tslib: "*" }),
      /* React Native and Metro bundler packages */
      addPeerDependencies("metro-config", {
        "metro-transform-worker": "*",
      }),

      /* Other packages */
      addDependencies("rn-fetch-blob", { lodash: "*" }),

      addPeerDependencies("react-native-config", {
        "react-native": "*",
      }),
      // Try to prevent pnpm-lock.yaml flakiness
      removeDependencies("follow-redirects", ["debug"], {
        kind: "peerDependencies",
      }),
    ],
    pkg,
    context,
  );

  return pkg;
}

function afterAllResolved(lockfile) {
  assertDependencyChecks(lockfile);
  return lockfile;
}

module.exports = {
  hooks: {
    afterAllResolved,
    readPackage,
  },
};
