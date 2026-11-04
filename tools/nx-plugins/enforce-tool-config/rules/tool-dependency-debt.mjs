// Packages whose scripts run a root tool they do not declare yet, keyed by project root. An entry
// silences the root tools it names, by executable, for that package only, and says when it goes
// away.
//
// This list only shrinks. The tool-dependency rule reports an entry the package no longer needs, so
// declaring the tool means deleting its entry here.

/**
 * @type {Record<string, {
 *   tools: string[],
 *   reason: string,
 * }>}
 */
export const TOOL_DEPENDENCY_DEBT = {};
