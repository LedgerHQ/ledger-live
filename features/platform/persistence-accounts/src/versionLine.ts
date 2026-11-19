/**
 * The migration steps of a stored account, in order. The stored `version` of an account counts
 * them. Each app keeps the code of the steps in its own account model, and reads and writes the
 * `version` as before: desktop stores 0 to 3 and writes 3; mobile has no `idFormat2018` step,
 * reads a stored 1 as 0 and writes 2 (LIVE-40516); apps/cli writes 1.
 */
export const ACCOUNTS_VERSION_LINE = [
  "idFormat2018",
  "aptosHardenedPath",
  "cryptoOrgResources",
] as const;
