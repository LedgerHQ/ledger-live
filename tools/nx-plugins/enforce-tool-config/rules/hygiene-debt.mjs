// Packages that break a hygiene check and cannot be fixed yet, keyed by project root. An entry
// silences the checks it names for that package only, and says when it goes away.
//
// This list only shrinks. The hygiene rule reports an entry the package no longer needs, so
// fixing a package means deleting its entry here.

/** @type {Record<string, { checks: string[], reason: string }>} */
export const HYGIENE_DEBT = {
  "shared/env": {
    checks: ["side-effects"],
    reason:
      "src/index.ts registers the env definitions with @ledgerhq/live-env when it is imported, " +
      'and the CLIs and end-to-end setups load it as a bare `import "@shared/env"`, which a ' +
      "bundler drops from a package marked side-effect free. Exit condition: the package is " +
      "deleted with the rest of the deprecated env layer, or the definitions are registered by a " +
      "function its consumers call.",
  },
};
