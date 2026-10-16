// Packages the conformance rules do not check yet, keyed by a directory: an entry covers that
// directory and every package below it.
//
// `rules` names the rules an entry exempts the subtree from. A rule added before every package
// conforms adds entries scoped to it, and its tool migration deletes them. Give every entry an exit
// condition.

/** @type {Record<string, { rules: string[], reason: string }>} */
export const EXCLUSIONS = {};
