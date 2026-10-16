// Packages the conformance rules do not check yet, keyed by a directory: an entry covers that
// directory and every package below it.
//
// `rules` scopes an entry to the named rules; without it the entry exempts the subtree from every
// rule. Each tool migration narrows or deletes the entries it makes obsolete, so this file shrinks
// to nothing. Give every entry an exit condition.

/** @type {Record<string, { rules?: string[], reason: string }>} */
export const EXCLUSIONS = {
  apps: {
    rules: ["tsconfig"],
    reason:
      "TEMPORARY. Application configs carry bundler, platform and build settings no preset " +
      "covers yet. Exit condition: an application archetype in @support/tsconfig, then each " +
      "application moved onto it.",
  },
  e2e: {
    rules: ["tsconfig"],
    reason:
      "TEMPORARY. End-to-end suites run their own TypeScript setups (Playwright, Detox). Exit " +
      "condition: the suites moved onto a @support/tsconfig preset.",
  },
  tests: {
    rules: ["tsconfig"],
    reason:
      "TEMPORARY. The dummy apps the end-to-end suites load are standalone web apps with their " +
      "own compiler options. Exit condition: they move onto a @support/tsconfig preset with the " +
      "e2e suites.",
  },
  tools: {
    rules: ["tsconfig"],
    reason:
      "TEMPORARY. Repository tooling runs as Node scripts on the NodeNext defaults, which no " +
      "package preset targets. Exit condition: a node tooling archetype in @support/tsconfig, " +
      "then each tool moved onto it.",
  },
  "features/platform/card": {
    rules: ["tsconfig"],
    reason:
      "TEMPORARY. A web and native package without JSX: the dual, web and native presets all " +
      "set `jsx`, so no preset reproduces its configs. Exit condition: the package enables JSX " +
      "or a preset for dual packages without it exists.",
  },
  "shared/clipboard": {
    rules: ["tsconfig"],
    reason:
      "TEMPORARY. Same as features/platform/card: a dual package without JSX. Exit condition: " +
      "the package enables JSX or a preset for dual packages without it exists.",
  },
  "shared/network-status": {
    rules: ["tsconfig"],
    reason:
      "TEMPORARY. Same as features/platform/card: a dual package without JSX. Exit condition: " +
      "the package enables JSX or a preset for dual packages without it exists.",
  },
  "libs/ledger-live-common": {
    rules: ["tsconfig"],
    reason:
      "TEMPORARY. A composite project rooted at the package directory, with a nested src/ " +
      "project that references it; no lib preset emits from that layout. Exit condition: the " +
      "package builds from src/ like the other libs, then extends @support/tsconfig/lib.",
  },
  "libs/ledgerjs": {
    rules: ["tsconfig"],
    reason:
      "TEMPORARY. The 22 ledgerjs packages extend the shared libs/ledgerjs/tsconfig.json across " +
      "package boundaries; moving them onto the lib preset would spell its six options out in " +
      "each package. Exit condition: those options are dropped or folded into a preset, then " +
      "each package extends @support/tsconfig/lib.",
  },
  "libs/ui/packages/native": {
    rules: ["tsconfig"],
    reason:
      "TEMPORARY. Its tsconfig.json extends nothing and its build config re-enables emit over " +
      "it. Exit condition: the package extends a @support/tsconfig preset.",
  },
  "libs/ui/packages/shared": {
    rules: ["tsconfig"],
    reason:
      "TEMPORARY. It emits without `rootDir`, which every lib preset sets. Exit condition: the " +
      "package sets its root to src/ and extends @support/tsconfig/lib.",
  },
};
