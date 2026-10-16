// The tool-config conformance rules, one module per tool (fmt, tsconfig, lint, jest), each checking
// that a package carries only what the support/ convention lets it carry for that tool.
//
// A rule module exports:
//   name    unique id, also the key an exclusion uses to scope itself to this rule
//   inputs  nx input globs the rule reads, e.g. "{projectRoot}/tsconfig*.json"; they become the
//           cache inputs of every project's `lint:tool-config` target
//   check   ({ workspaceRoot, projectRoot }) => Array<{ file: string, message: string }>
//
// Add the module here to enable it. Packages that do not conform yet go in ../exclusions.mjs.

import fmt from "./fmt.mjs";
import lint from "./lint.mjs";

/**
 * @typedef {{ file: string, message: string }} Violation
 * @typedef {{ workspaceRoot: string, projectRoot: string }} RuleContext
 * @typedef {{ name: string, inputs: string[], check: (context: RuleContext) => Violation[] }} Rule
 */

/** @type {Rule[]} */
export const RULES = [fmt, lint];
