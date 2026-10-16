// Packages the conformance rules do not check yet, keyed by a directory: an entry covers that
// directory and every package below it.
//
// `rules` names the rules an entry exempts the subtree from. A rule added before every package
// conforms adds entries scoped to it, and its tool migration deletes them. Give every entry an exit
// condition.

const LINT_LEAVES =
  "keep their own oxlint config, which no support/lint preset reproduces yet. Exit condition: " +
  "the subtree moves onto its layer's preset and its config is deleted.";

/** @type {Record<string, { rules: string[], reason: string }>} */
export const EXCLUSIONS = {
  apps: {
    rules: ["lint", "tsconfig"],
    reason:
      `TEMPORARY. lint: the applications ${LINT_LEAVES} ` +
      "tsconfig: application configs carry bundler, platform and build settings no preset " +
      "covers yet. Exit condition: an application archetype in @support/tsconfig, then each " +
      "application moved onto it.",
  },
  e2e: {
    rules: ["lint", "tsconfig"],
    reason:
      `TEMPORARY. lint: the end-to-end suites ${LINT_LEAVES} ` +
      "tsconfig: end-to-end suites run their own TypeScript setups (Playwright, Detox). Exit " +
      "condition: the suites moved onto a @support/tsconfig preset.",
  },
  "libs/coin-modules": {
    rules: ["lint"],
    reason: `TEMPORARY. The coin modules, and coin-bitcoin on top of them, ${LINT_LEAVES}`,
  },
  "libs/ledger-live-common": {
    rules: ["lint", "tsconfig"],
    reason:
      `TEMPORARY. lint: live-common and its tools ${LINT_LEAVES} ` +
      "tsconfig: a composite project rooted at the package directory, with a nested src/ " +
      "project that references it; no lib preset emits from that layout. Exit condition: the " +
      "package builds from src/ like the other libs, then extends @support/tsconfig/lib.",
  },
  "libs/ledger-services": {
    rules: ["lint"],
    reason: `TEMPORARY. The ledger-services packages ${LINT_LEAVES}`,
  },
  "libs/ledgerjs": {
    rules: ["lint", "tsconfig"],
    reason:
      `TEMPORARY. lint: the ledgerjs packages ${LINT_LEAVES} ` +
      "tsconfig: the 22 ledgerjs packages extend the shared libs/ledgerjs/tsconfig.json across " +
      "package boundaries; moving them onto the lib preset would spell its six options out in " +
      "each package. Exit condition: those options are dropped or folded into a preset, then " +
      "each package extends @support/tsconfig/lib.",
  },
  "libs/ui": {
    rules: ["lint"],
    reason: `TEMPORARY. The legacy UI packages ${LINT_LEAVES}`,
  },
  "libs/wallet-btc": {
    rules: ["lint"],
    reason: `TEMPORARY. wallet-btc ${LINT_LEAVES}`,
  },
  tests: {
    rules: ["lint", "tsconfig"],
    reason:
      `TEMPORARY. lint: the test apps ${LINT_LEAVES} ` +
      "tsconfig: the dummy apps the end-to-end suites load are standalone web apps with their " +
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
