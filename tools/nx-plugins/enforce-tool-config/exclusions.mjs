// Packages the conformance rules do not check yet, keyed by a directory: an entry covers that
// directory and every package below it.
//
// `rules` scopes an entry to the named rules; without it the entry exempts the subtree from every
// rule. Each tool migration narrows or deletes the entries it makes obsolete, so this file shrinks
// to nothing. Give every entry an exit condition.

/** @type {Record<string, { rules?: string[], reason: string }>} */
export const EXCLUSIONS = {
  apps: {
    reason:
      "TEMPORARY. Application configs are out of scope of the support/ migration: they carry " +
      "bundler, platform and build settings no preset covers yet. Exit condition: each tool " +
      "migration that moves the apps onto its preset removes them from this entry.",
  },
  e2e: {
    reason:
      "TEMPORARY. End-to-end suites run their own jest, lint and TypeScript setups (Playwright, " +
      "Detox). Exit condition: each tool migration that moves the suites onto its preset removes " +
      "them from this entry.",
  },
  libs: {
    reason:
      "TEMPORARY. Legacy libraries keep hand-rolled configs, down to one jest config per coin " +
      "module. Exit condition: each tool migration that moves libs/ onto its " +
      "preset scopes this entry away from that tool's rule, then the entry is deleted.",
  },
};
