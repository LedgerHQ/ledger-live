// Packages whose scripts run a root tool they do not declare yet, keyed by project root. An entry
// silences the root tools it names, by executable, for that package only, and says when it goes
// away.
//
// This list only shrinks. The tool-dependency rule reports an entry the package no longer needs, so
// declaring the tool means deleting its entry here.

const ZX = "TEMPORARY. Exit condition: LIVE-40431 declares zx in each package that runs it.";

const NX = "TEMPORARY. Exit condition: LIVE-40432 declares nx in each package that runs it.";

/**
 * @type {Record<string, {
 *   tools: string[],
 *   reason: string,
 * }>}
 */
export const TOOL_DEPENDENCY_DEBT = {
  "apps/cli": { tools: ["zx"], reason: ZX },
  "apps/ledger-live-desktop": { tools: ["zx"], reason: ZX },
  "apps/ledger-live-mobile": { tools: ["zx"], reason: ZX },
  "devtools/registry": { tools: ["nx"], reason: NX },
  "e2e/mobile": { tools: ["nx"], reason: NX },
};
