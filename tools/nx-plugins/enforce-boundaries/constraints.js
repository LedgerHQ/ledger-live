"use strict";

/**
 * Module-boundary dependency constraints for the new architecture
 * (domain/, shared/, features/). Shape mirrors @nx/enforce-module-boundaries
 * depConstraints so this config ports verbatim to .oxlintrc.json when
 * @nx/oxlint publishes stable.
 *
 * A rule fires only when the source package has the sourceTag. Legacy
 * packages without matching tags (libs/, apps/, e2e/, tools/) are
 * unconstrained on purpose.
 */
const DEP_CONSTRAINTS = [
  { sourceTag: "scope:shared", onlyDependOnLibsWithTags: ["scope:shared"] },
  { sourceTag: "scope:domain", onlyDependOnLibsWithTags: ["scope:domain", "scope:shared"] },
  {
    sourceTag: "scope:features",
    onlyDependOnLibsWithTags: ["scope:features", "scope:domain", "scope:shared"],
  },
  {
    sourceTag: "type:domain-entity",
    onlyDependOnLibsWithTags: ["type:domain-entity", "scope:shared"],
  },
  {
    sourceTag: "type:domain-api",
    onlyDependOnLibsWithTags: ["type:domain-entity", "type:domain-api", "scope:shared"],
  },
  {
    sourceTag: "type:feature-platform",
    onlyDependOnLibsWithTags: ["type:feature-platform", "scope:domain", "scope:shared"],
  },
  {
    sourceTag: "type:feature-flow",
    onlyDependOnLibsWithTags: [
      "type:feature-flow",
      "type:feature-platform",
      "scope:domain",
      "scope:shared",
    ],
  },
];

/**
 * Scopes whose dependency graph must stay acyclic. A cycle is reported only
 * when every package in it carries one of these tags: legacy cycles inside
 * libs/ predate the new architecture and stay unconstrained, same as
 * DEP_CONSTRAINTS. Composition inside features/ is one-way — a parent flow
 * depends on its sub-flows, never the reverse.
 */
const ACYCLIC_SCOPES = ["scope:shared", "scope:domain", "scope:features"];

/** Per-package exceptions: { sourceRoot, targetRoot, allowedImport }. Remove when @ledgerhq/live-env moves to ts-libs. */
const BOUNDARY_EXCEPTIONS = [
  { sourceRoot: "shared/env", targetRoot: "libs/env", allowedImport: "@ledgerhq/live-env" },
];

module.exports = { DEP_CONSTRAINTS, ACYCLIC_SCOPES, BOUNDARY_EXCEPTIONS };
