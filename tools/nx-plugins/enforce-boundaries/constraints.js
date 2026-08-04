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

/** Per-package exceptions: { sourceRoot, targetRoot, allowedImport }. Remove when @ledgerhq/live-env moves to ts-libs. */
const BOUNDARY_EXCEPTIONS = [
  { sourceRoot: "shared/env", targetRoot: "libs/env", allowedImport: "@ledgerhq/live-env" },
];

/**
 * Packages no workspace manifest may declare, whatever the dependency field.
 *
 * `hoist=false` means a package can only resolve what it declares, so banning the
 * declaration is enough to ban the import too — an undeclared import fails to resolve.
 *
 * `@ledgerhq/errors` is frozen and being sunset (LIVE-32915): its classes now live in the
 * package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared
 * home below the coin layer. It stays in the repo to keep being published for external
 * consumers, and is bridged to the external coin packages that still peer-depend on it via
 * `pnpm.packageExtensions` in the root package.json — see its DEPRECATED.md.
 */
const BANNED_DEPENDENCIES = [
  {
    name: "@ledgerhq/errors",
    reason:
      "frozen and being sunset (LIVE-32915). Define errors as native classes in your own " +
      "src/errors.ts and branch on `error.name`; shared coin-layer errors live in " +
      "@ledgerhq/ledger-wallet-framework/errors. See .agents/skills/errors/SKILL.md.",
  },
];

module.exports = { DEP_CONSTRAINTS, BOUNDARY_EXCEPTIONS, BANNED_DEPENDENCIES };
