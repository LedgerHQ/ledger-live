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
    rules: ["lint"],
    reason: `TEMPORARY. The applications ${LINT_LEAVES}`,
  },
  e2e: {
    rules: ["lint"],
    reason: `TEMPORARY. The end-to-end suites ${LINT_LEAVES}`,
  },
  "libs/coin-modules": {
    rules: ["lint"],
    reason: `TEMPORARY. The coin modules, and coin-bitcoin on top of them, ${LINT_LEAVES}`,
  },
  "libs/ledger-live-common": {
    rules: ["lint"],
    reason: `TEMPORARY. live-common and its tools ${LINT_LEAVES}`,
  },
  "libs/ledger-services": {
    rules: ["lint"],
    reason: `TEMPORARY. The ledger-services packages ${LINT_LEAVES}`,
  },
  "libs/ledgerjs": {
    rules: ["lint"],
    reason: `TEMPORARY. The ledgerjs packages ${LINT_LEAVES}`,
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
    rules: ["lint"],
    reason: `TEMPORARY. The test apps ${LINT_LEAVES}`,
  },
};
