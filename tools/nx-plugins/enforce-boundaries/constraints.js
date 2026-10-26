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
 *
 * `scope:support` is allowed as a target everywhere: support packages are development tooling,
 * taken as devDependencies, and the Nx graph does not distinguish those from runtime dependencies.
 * As a source, it may only reach `scope:support` and `scope:shared`: tooling carries no domain or
 * feature knowledge, so a test harness that needs a domain's mocks lives in that domain package.
 * Third-party test tooling (lumen, react-native) is not a graph node and stays unconstrained.
 */
const DEP_CONSTRAINTS = [
  { sourceTag: "scope:support", onlyDependOnLibsWithTags: ["scope:support", "scope:shared"] },
  { sourceTag: "scope:shared", onlyDependOnLibsWithTags: ["scope:shared", "scope:support"] },
  {
    sourceTag: "scope:domain",
    onlyDependOnLibsWithTags: ["scope:domain", "scope:shared", "scope:support"],
  },
  {
    sourceTag: "scope:features",
    onlyDependOnLibsWithTags: ["scope:features", "scope:domain", "scope:shared", "scope:support"],
  },
  {
    sourceTag: "type:domain-entity",
    onlyDependOnLibsWithTags: ["type:domain-entity", "scope:shared", "scope:support"],
  },
  {
    sourceTag: "type:domain-api",
    onlyDependOnLibsWithTags: [
      "type:domain-entity",
      "type:domain-api",
      "scope:shared",
      "scope:support",
    ],
  },
  {
    sourceTag: "type:feature-platform",
    onlyDependOnLibsWithTags: [
      "type:feature-platform",
      "scope:domain",
      "scope:shared",
      "scope:support",
    ],
  },
  {
    sourceTag: "type:feature-flow",
    onlyDependOnLibsWithTags: [
      "type:feature-flow",
      "type:feature-platform",
      "scope:domain",
      "scope:shared",
      "scope:support",
    ],
  },
];

/**
 * Per-package exceptions: { sourceRoot, targetRoot?, allowedImport }. `targetRoot` scopes an
 * exception to a graph edge; without it the exception only allows the source import.
 * `shared/env` wraps `@ledgerhq/live-env` and is the one package allowed to import it.
 */
const BOUNDARY_EXCEPTIONS = [{ sourceRoot: "shared/env", allowedImport: "@ledgerhq/live-env" }];

/**
 * Legacy `@ledgerhq/*` packages banned in shared/, domain/ and features/ source files, on top of
 * the ones derived from the graph (every `scope:libs` node). These left `libs/` for npm, so the
 * graph no longer tags them.
 */
const LEGACY_PACKAGES = [
  "@ledgerhq/live-config",
  "@ledgerhq/live-env",
  "@ledgerhq/live-currency-format",
  "@ledgerhq/domain-service",
  "@ledgerhq/evm-tools",
];

/**
 * Third-party packages a tagged source may neither declare in its manifest nor import.
 * Entities hold schemas, types and state: no UI framework.
 */
const BANNED_EXTERNALS_BY_TAG = [
  { sourceTag: "type:domain-entity", packages: ["react", "react-native"] },
];

/**
 * Packages no workspace manifest may declare, whatever the dependency field.
 *
 * A workspace package does not resolve from the pnpm virtual store, so banning
 * the declaration bans the import too — an undeclared import fails to resolve.
 */
const BANNED_DEPENDENCIES = [];

module.exports = {
  DEP_CONSTRAINTS,
  BOUNDARY_EXCEPTIONS,
  LEGACY_PACKAGES,
  BANNED_EXTERNALS_BY_TAG,
  BANNED_DEPENDENCIES,
};
