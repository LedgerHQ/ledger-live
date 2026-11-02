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

/** Workspace roots checked by `LEGACY_IMPORT_RULE`. */
const LEGACY_SOURCE_ROOTS = ["shared", "domain", "features"];

const LEGACY_IMPORT_RULE = `Legacy @ledgerhq/* imports and relative paths into libs/ are forbidden in ${LEGACY_SOURCE_ROOTS.map(r => `${r}/`).join(", ")} source files.`;

/**
 * Legacy packages for `LEGACY_IMPORT_RULE`, on top of every `scope:libs` node of the graph.
 * These left `libs/` for npm, so the graph no longer tags them.
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

/**
 * The `@devtools/*` packages each `@devtools/*` package may depend on; "*" allows them all.
 * A package missing from the table, such as a tool, may depend on none.
 */
const DEVTOOLS_ALLOWED_IMPORTS = {
  "@devtools/registry": "*",
  "@devtools/shell": ["@devtools/transport", "@devtools/registry"],
  "@devtools/bindings": ["@devtools/registry"],
  "@devtools/wire": ["@devtools/transport", "@devtools/protocols"],
  "@devtools/protocols": ["@devtools/transport"],
  "@devtools/relay": ["@devtools/transport", "@devtools/protocols"],
  "@devtools/transport-panel": ["@devtools/transport"],
};

/**
 * The `@devtools/*` packages each `@devtools/*` package may reach under `DEVTOOLS_TYPE_ONLY_RULE`;
 * "*" allows them all.
 */
const DEVTOOLS_TYPE_ONLY_IMPORTS = {
  "@devtools/bindings": "*",
};

const DEVTOOLS_TYPE_ONLY_RULE =
  'A DEVTOOLS_TYPE_ONLY_IMPORTS target may only be reached through `import type`, `export type … from` or `typeof import("…")`: the build erases them, so the target stays lazily loaded. A value import, `import { type X }`, `import()` or `require()` loads it at runtime.';

module.exports = {
  DEP_CONSTRAINTS,
  BOUNDARY_EXCEPTIONS,
  LEGACY_SOURCE_ROOTS,
  LEGACY_IMPORT_RULE,
  LEGACY_PACKAGES,
  BANNED_EXTERNALS_BY_TAG,
  BANNED_DEPENDENCIES,
  DEVTOOLS_ALLOWED_IMPORTS,
  DEVTOOLS_TYPE_ONLY_IMPORTS,
  DEVTOOLS_TYPE_ONLY_RULE,
};
